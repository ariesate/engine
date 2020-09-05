import {
  propTypes,
  createElement,
  Fragment,
  ref,
  reactive,
  createComponent,
  refComputed,
  vnodeComputed,
  createSmartProp,
  delegateLeaf,
  isReactiveLike, objectComputed,
  tryToRaw,
  invariant,
  debounceComputed,
  shallowEqual
} from 'axii';
import { chain, hasConflict } from '../util';
/**
 * useForm
 * 关于 touched，只要和 initialValue 不一样，就算是 touched
 * 内部的 reset 是 reset 会 initialValue。可以通过语法糖 resetToDefaultValue，实际上是 setValues(defaultValues)
 *
 * Features:
 * 1. schema 参考 formik，用 yup
 * 2. 支持 initialValues
 * 3. 支持 error/touched
 * 4. 支持 reset/setValues
 * 6. 支持 服务端返回的 error 怎么算？error 对象要可以编辑，draft ？
 * 7. 支持 disable
 * 8. 支持 submit 的 loading 状态
 * 9. set to defaultValues 和 clear 是语法糖。
 *
 * 使用：
 * 通过 const {fields} = useForm()
 * <Input {...fields.name.props} />
 * <Message>{fields.name.error.message}</Message />
 * <Checkbox {...fields.gender.props} />
 * <Message>{fields.gender.error.message}</Message />
 *
 * 想要直接获取值:
 * fields.name.value
 *
 *
 */


function dirtyCheckPlugin({ getInitialValues = () => ({}), isEqual = {} }) {
  const initialValues = getInitialValues()
  const touchedByFieldName = reactive({})

  const onChange = (fieldName, draftProps) => {
    const initialValue = initialValues[fieldName]
    const isEqualFn = isEqual[fieldName] || ((rawValue, rawNextValue) => {
      // rawValue 是通过 tryToRaw 出来的，即使是 ref 也是 { value: xxx }，所以不太可能不是 object
      invariant((typeof rawValue === 'object') && (typeof rawNextValue === 'object'), `find non-object value: ${rawValue}, ${rawNextValue}`)
      return shallowEqual(rawValue, rawNextValue)
    })
    // initialValue 也可能出现用户自己定义的 ref，见上面描述的情况。另外即使 initialValue 没有默认值，
    // smartValue 也可能根据 propType 创建正确的引用，或者创建一个 ref()
    touchedByFieldName[fieldName] = !isEqualFn(tryToRaw(initialValue), draftProps.value)
  }

  return {
    state: {
      touchedByFieldName
    },
    smartValue: (fieldName, propType) => {
      if (fieldName in initialValues) return
      const propTypeDefaultValue = propType.defaultValue
      initialValues[fieldName] = propTypeDefaultValue === undefined ? ref() : propTypeDefaultValue
    },
    createField: (fieldName) => {
      if (!(fieldName in touchedByFieldName)) touchedByFieldName[fieldName] = false
      return {
        props: {
          onChange: (...argv) => onChange(fieldName, ...argv),
        },
        // 这里 delegate 给出去的就是一个 ref 了
        touched: delegateLeaf(touchedByFieldName)[fieldName]
      }
    },
    output: {
      isTouched: refComputed(() => {
        return Object.values(touchedByFieldName).some(touched => touched)
      })
    }
  }
}

/**
 * TODO validate 需要支持的：
 * 1. 单个校验。
 * 2. 联合校验
 * 3. 异步校验。
 *
 * 实现：
 * 我们保存的数据叫做 errorsByRuleName/validationResultByRuleName，这里的 ruleName 既可以是 fieldName，也可以是用户自定义的，这是为了实现一些组合的验证条件。
 * 我们在传给组件的 prop 里面，会有一个 error 字段，一个 isValid 字段。这是自动用 fieldName 去匹配 errorsByRuleName/validationResultByRuleName 得到的。
 * 注意，一个 rule 可以有多个 ruleItem，就像验证"名字"，可以有长度、重名等各种子规则。
 *
 * scheme 的结构：一个 function，任何变化都会执行一遍。
 * 我们会传入的参数：1: 当前触发变化的 fieldName. 2: draftProps 3: props
 * 用户即可以选择每次做全量验证，也可以选择根据 fieldName 做增量的。
 *
 * 要求返回的数据格式:
 * {
 *  [验证了的规则] : [验证结果 | promise]
 * }
 *
 * 验证结果格式:
 * { passed: [bool], errors: [用户定义 error 对象] }。
 */
export const VALIDATION_STATUS_PENDING = 'pending'
export const VALIDATION_STATUS_ERROR = 'error'
// resolved 和 initial 都是 none，这里没区分是认为用户没有这个需要
export const VALIDATION_STATUS_NONE = 'none'



// TODO 支持 yup？
// TODO 支持自定的简单 kv 格式？
function validationPlugin({ scheme }) {
  if (!scheme) return {}

  const tryToValidate = (changedFieldName, draftProps, props) => {
    const result = scheme(changedFieldName, draftProps, props)
    if (!result) return

    debounceComputed(() => {
      Object.entries(result).forEach(([ruleName, result]) => {
        if (result instanceof Promise) {
          // 注意在发送时、发送失败并不清空上一次的 error 等状态。只有在成功时才修改。
          validationStatusByRuleName[ruleName].value = VALIDATION_STATUS_PENDING
          result.then(({ passed, errors }) => {
            invariant(passed ? true : (errors && errors.length), `failed rule ${ruleName} must have errors in result.` )
            debounceComputed(() => {
              validationStatusByRuleName[ruleName].value = VALIDATION_STATUS_NONE
              validationResultByRuleName[ruleName].value = passed
              errorsByRuleName[ruleName].splice(0, errorsByRuleName[ruleName].length, (passed ? [] : errors))
            })
          }).catch(() => {
            validationStatusByRuleName[ruleName].value = VALIDATION_STATUS_ERROR
          })
        } else {
          invariant(result.passed ? true : (result.errors && result.errors.length), `failed rule ${ruleName} must have errors in result.` )
          console.log(ruleName, result)
          validationResultByRuleName[ruleName].value = result.passed
          errorsByRuleName[ruleName].splice(0, errorsByRuleName[ruleName].length, (result.passed ? [] : result.errors))
        }
      })
    })
  }

  const errorsByRuleName = {}
  const validationResultByRuleName = {}
  const validationStatusByRuleName = {}

  // TODO 可以通过 proxy，在读时在创建 output 中的 computed。
  return {
    state: {
      errorsByRuleName,
      validationResultByRuleName,
    },
    createField: (fieldName) => {
      if(!(fieldName in errorsByRuleName)) errorsByRuleName[fieldName] = reactive([])
      if(!(fieldName in validationResultByRuleName)) validationResultByRuleName[fieldName] = ref()
      if(!(fieldName in validationStatusByRuleName)) validationStatusByRuleName[fieldName] = ref()

      const validate = (draftProps, props) => tryToValidate(fieldName, draftProps, props)

      return {
        // 默认每个 field 都可以有多个验证条件，errors 记录每一个条件的结果
        errors: errorsByRuleName[fieldName],
        validateStatus: validationStatusByRuleName[fieldName],
        // 语法糖，validateStatus 其实已经可以判断
        isValidating: refComputed(() => validationStatusByRuleName[fieldName].value === VALIDATION_STATUS_PENDING),
        validate,
        isValid: validationResultByRuleName[fieldName],
        // 这是要传到组件上的 listener
        props: ({ validateTrigger = 'onChange'} = {}) => ({
          ...(validateTrigger ? {[validateTrigger] : validate} : {}),
        }),
      }
    },
    output: {
      // 有一个是 error，整体就是 false。此外，有一个 undefined，就是 undefined。最后没有 error 也没有 undefined 才是 valid。
      isValid: refComputed(() => {

        let hasError = false
        let hasUndefined = false
        const noError =  Object.values(validationResultByRuleName).every(({ passed }) => {
          if (passed === false) hasError = true
          if (passed === undefined) hasUndefined = true
          // 注意，我们只在 passed === false 是打断，因为不管有没有 undefined，都应该标记为 false
          // 但是 passed 为 Undefined 的情况，还要判断后面有没有 error，所有不打断
          return passed !== false
        })
        // 如果没有 error，那么就看有没有 undefined。
        return noError ? (hasUndefined ? undefined : true) : false
      }),
      hasError: refComputed(() => {
        // 虽然前面确保了只要有没 pass， 就一定有 error，但是这里是用 validationResultByRuleName 还是更保险。
        return Object.values(errorsByRuleName).some(({ passed }) => {
          return passed === false
        })
      })
    }
  }
}
export const SUBMIT_STATUS_NONE = 'none'
export const SUBMIT_STATUS_PENDING = 'pending'
export const SUBMIT_STATUS_ERROR = 'error'
export const SUBMIT_STATUS_SUCCESS = 'success'
function submitPlugin({ submit }, values) {
  const submitStatus = ref(SUBMIT_STATUS_NONE)
  const isSubmitting = refComputed(() => submitStatus.value === SUBMIT_STATUS_PENDING)
  return {
    output: {
      submit() {
        const promise = submit(values)
        if (promise instanceof Promise) {
          submitStatus.value = SUBMIT_STATUS_PENDING
          promise.then(() => {
            submitStatus.value = SUBMIT_STATUS_SUCCESS
          }).catch(() => {
            submitStatus.value = SUBMIT_STATUS_ERROR
          })
        }
      },
      submitStatus,
      isSubmitting
    }
  }
}


/**
 * 这里有个关键问题，即我们需要把 value 的引用放在 useForm 里，通过 field.name.props 传给组件。
 * 但是在 useForm 里面并不知道相应 form 组件的 value 的类型。有可能是 string 也有可能是 [moment, moment] 等更复杂的类型。
 * 这个需求本质上，是有一些 util 需要代理用户做一个数据操作的事情，要负责创造数据引用，同时把数据引用交换给用户。用户在操作数据时时知道类型的，但 util 不知道也不需要知道。
 * 这种情况只有在"引用强感知"的场景里才有，例如 AXII，像 react 就没有，因为每次变化都是重新从 render 中创建新引用，再传给组件。
 *
 * 针对这个问题的接法是，由框架提供一个 Magic 类型，实际里面包装了一个回调函数，当组件收到这个 props 时，会把自己的类型传给回调，回调再生成真实的引用。
 * 回调是在 util 中的，因此回调就可以保存引用了。组件 prop 也能拿到正确的类型。
 */
function createNamedFieldProxy(fieldName, values, pluginInstances) {

  // 注意，用户可能没有设置 initialValue，这时显示的是组件的 defaultValue，
  // 这种情况应该把 defaultValue 作为 initialValue 去做 touched 的判断
  // 另外这里从 values 里面取，因为 values 使用的是引用，之后会变化。

  const attributes = {}
  const pluginPropsCollection = []
  const pluginSmartValue = []
  pluginInstances.forEach(({ createField, smartValue }) => {
    if (smartValue) pluginSmartValue.push(smartValue)

    if (createField) {
      const { props, ...restAttrs } = createField(fieldName)
      invariant(!hasConflict(Object.keys(attributes), Object.keys(restAttrs)), `key conflict detected: ${Object.keys(attributes).join(',')}, ${Object.keys(restAttrs).join(',')}`)
      Object.assign(attributes, restAttrs)
      if (props) pluginPropsCollection.push(props)
    }
  })

  const smartValueProp = createSmartProp((propType) => {


    if (!( fieldName in values)) {
      // propType.defaultValue 会创造新引用，不用 clone.
      values[fieldName] = propType.defaultValue
      pluginSmartValue.forEach(smartValue => smartValue(fieldName, propType))
    }
    // CAUTION 这里生成了 reactive
    if (isReactiveLike(values[fieldName])) return values[fieldName]

    // TODO 这里可能还有更复杂的判断，比如即使是 object，组件内部仍然当成 ref 来用
    // 再比如碰到复杂的对象像，用户可能使用 Immutable 的形式，也当成 ref 来用。
    // 目前，由于上面使用 isReactiveLike 来判断，如果真有这种复杂情况，那么用户在 getInitialValues 自己用 ref 标记一下就行。
    return typeof values[fieldName] === 'object' ? reactive(values[fieldName]) : ref(values[fieldName])
  })


  return new Proxy({}, {
    get(target, key) {
      if (key === 'props') {
        return (options) => {
          const props = { value: smartValueProp}
          pluginPropsCollection.forEach((pluginProps) => {
            const finalPluginProps = (typeof pluginProps === 'function') ? pluginProps(options) : pluginProps

            // CAUTION 注意这里处理了函数的串联
            Object.entries(finalPluginProps).forEach(([propName, pluginProp]) => {
              const hasProp = propName in props
              // 如果 prop 要覆盖的话，只能都是 function 才行。
              invariant(!(hasProp && (typeof pluginProp !== 'function' || typeof props[propName] !== 'function')), `${propName} is not function, cannot chain` )
              props[propName] = hasProp ? chain(props[propName], pluginProp) : pluginProp
           })
          })
          return props
        }
      } else if (key === 'value') {
        return values[fieldName]
      }else {
        return attributes[key]
      }
    }
  })
}


function createUseForm(...plugins) {

  return function useForm(props) {
    const {getInitialValues = () => ({})} = props
    const values = getInitialValues()

    const pluginInstances = plugins.map(plugin => plugin(props, values))

    const fields = new Proxy({}, {
      get: (target, fieldName) => {
        if (!target[fieldName]) {
          target[fieldName] = createNamedFieldProxy(fieldName, values, pluginInstances)
        }
        return target[fieldName]

      }
    })

    const output = {
      fields,
      // TODO reset/set
      reset(fields) {
  
      },
    }

    pluginInstances.forEach(instance => {
      Object.assign(output, instance.output || {})
    })

    return output
  }

}

export default createUseForm(dirtyCheckPlugin, validationPlugin, submitPlugin)
