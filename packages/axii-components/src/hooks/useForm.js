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
  shallowEqual,
  replace,
  isRef
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
 */


/**********************
 * dirtyCheckPlugin
 **********************/
function dirtyCheckPlugin({ getInitialValues = () => ({}), isEqual = {} }, values) {
  const initialValues = getInitialValues()

  const equalFn = (fieldName, value, nextValue) => {
    // 初始情况，说明 smartProp 回调还没有挂载好，这里可能触发两次，一次是 values 挂在了，一次是 initialValues 挂载了
    if (value === undefined || nextValue === undefined) return true
    // 如果用户有自己的对比函数，就用用户的，因为可能有复杂对象。
    if (isEqual[fieldName]) return isEqual(value, nextValue)
    // 以下是默认的 compare
    if (typeof value !== 'object' || typeof nextValue !== 'object') return value === nextValue
    return shallowEqual(value, nextValue)
  }

  return {
    smartValue: (fieldName, propType) => {
      if (fieldName in initialValues) return
      initialValues[fieldName] = tryToRaw(propType.defaultValue, true)
    },
    createField: (fieldName) => {
      return {
        changed: refComputed(() => {
          return !equalFn(fieldName, initialValues[fieldName], values[fieldName])
        })
      }
    },
    output: {
      isChanged: refComputed(() => {
        return Object.entries(initialValues).some(([valueName, initialValue])=> !equalFn(valueName, initialValue, values[valueName]))
      })
    }
  }
}

/**********************
 * validationPlugin
 *
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
 ***********************/
export const VALIDATION_STATUS_PENDING = 'pending'
export const VALIDATION_STATUS_ERROR = 'error'
// resolved 和 initial 都是 none，这里没区分是认为用户没有这个需要
export const VALIDATION_STATUS_NONE = 'none'

function validationPlugin({ scheme }) {
  if (!scheme) return {}

  const tryToValidate = (changedFieldName, { value: nextValue }, { value }) => {
    // CAUTION 这里修改了一下格式，因为验证函数没有必要知晓 ref 的格式
    const nextRawValue = isRef(value) ? nextValue.value : nextValue
    const result = scheme(changedFieldName, nextRawValue, tryToRaw(value, true))
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
              errorsByRuleName[ruleName].splice(0, errorsByRuleName[ruleName].length, ...(passed ? [] : errors))
            })
          }).catch(() => {
            validationStatusByRuleName[ruleName].value = VALIDATION_STATUS_ERROR
          })
        } else {
          invariant(result.passed ? true : (result.errors && result.errors.length), `failed rule ${ruleName} must have errors in result.` )
          validationResultByRuleName[ruleName].value = result.passed
          errorsByRuleName[ruleName].splice(0, errorsByRuleName[ruleName].length, ...(result.passed ? [] : result.errors))
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
      }),
      validate() {
        // TODO 手动执行
      },
      resetValidation() {
        debounceComputed(() => {
          Object.keys(validationResultByRuleName).forEach(key => {
            validationResultByRuleName[key].value = undefined
          })

          Object.keys(validationStatusByRuleName).forEach(key => {
            validationStatusByRuleName[key].value = undefined
          })

          Object.keys(errorsByRuleName).forEach(key => {
            errorsByRuleName[key].splice(0)
          })
        })
      }
    }
  }
}

export function simpleScheme(keyToRules) {
  return function scheme(fieldName, nextValue, value) {
    const rules = keyToRules[fieldName]
    if (rules) {
      // rules 支持两种格式
      let result
      // 1. 一个函数，需要返回 { passed, errors }
      if (typeof rules === 'function') {
        result = rules(nextValue, value)
      } else if (typeof rules === 'object') {
        // 2. map 形式 [ruleName] : [ruleFn]
        // ruleFn 有错误则返回 error, 没有不用返回
        const errors = []
        Object.entries(rules).forEach(([ruleName, ruleFn]) => {
          const error = ruleFn(fieldName, nextValue, value)
          if (error) errors.push(error)
        })

        result = {
          passed: errors.length === 0,
          errors
        }
      }

      return {
        [fieldName] : result
      }
    } else {
      console.warn(`${fieldName} have not validation rules`)
    }
  }
}

// 基本的 rule
simpleScheme.required = (asEmpty = [undefined, '']) => {
  // 默认只检测 undefined 和 空字符串，用户可以自定义
  return (fieldName, nextValue) => {
    let error
    asEmpty.some((isEmpty) => {
      if (typeof isEmpty === 'function') {
        const result = isEmpty(nextValue)
        if (result) {
          error = result
          return true
        }
      } else {
        if (nextValue === isEmpty) {
          error = `${fieldName} cannot be ${JSON.stringify(isEmpty)}`
          return true
        }
      }
    })

    return error
  }
}

simpleScheme.range = (from, to, excludeFrom, excludeTo) => {
  return (fieldName, nextValue) => {
    invariant(!isNaN(nextValue), `${fieldName} is not a number, cannot use range rule to validate.`)
    if (from !== undefined && (excludeFrom ? (nextValue <= from) : (nextValue < from))) {
      return `${fieldName} cannot be smaller than ${from}`
    }
    if (to !== undefined && (excludeTo ? (nextValue >= to) : (nextValue > to))) {
      return `${fieldName} cannot be larger than ${to}`
    }
  }
}

/**********************
 * submitPlugin
 **********************/

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

/**********************
 * resetPlugin
 **********************/
function resetPlugin({ getInitialValues = () => ({})} , values, setValues) {
  const initialValues = getInitialValues()
  const smartValuePropTypes = {}
  return {
    smartValue(fieldName, propType) {
      if (!(fieldName in initialValues)) {
        smartValuePropTypes[fieldName] = propType
      }
    },
    output: {
      reset() {
        const nextValues = getInitialValues()
        Object.entries(smartValuePropTypes).forEach(([fieldName, propType]) => {
          // nextValues[fieldName] = tryToRaw(propType.defaultValue, true)
          nextValues[fieldName] =propType.defaultValue
        })

        setValues(nextValues)
      }
    }
  }
}

/**
 * 这里有个关键问题，即我们需要把 value 的引用放在 useForm 里，通过 field.name.props 传给组件。
 * 但是在 useForm 里面并不知道相应 form 组件的 value 的类型。有可能是 string 也有可能是 [moment, moment] 等更复杂的类型。
 * 这个需求本质上，是有一些 util 需要代理用户做一个数据操作的事情，要负责创造数据引用，同时把数据引用交换给用户。用户在操作数据时时知道类型的，但 util 不知道也不需要知道。
 * 这种情况只有在"引用强感知"的场景里才有，例如 AXII，像 react 就没有，因为每次变化都是重新从 render 中创建新引用，再传给组件。
 *
 * 针对这个问题的接法是，由框架提供一个 smartProp 机制，实际里面包装了一个回调函数，当组件收到这个 props 时，会把自己的类型传给回调，回调再生成真实的引用。
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
    const hasValue = fieldName in values
    // 因为 plugin 里面也可能读取 values，可能导致多余的重复计算，所以这里 debounce 一下。
    debounceComputed(() => {
      if (!hasValue) {
        // propType.defaultValue 会创造新引用，不用 clone.
        // 注意 values 已经整体是 reactive 了，继续赋值 reactive 会自动 tryToRaw。
        values[fieldName] = propType.defaultValue
      }
      // plugin 的 smartValue 触发一定要放在最后，因为它可能引起 plugin 内部的部分 computed 重新计算。
      // 只有这时候，values 上的引用才都已经是 reactive 了。
      // CAUTION 这里认为不会出现当 smartValue 当钩子用的情况，所以只在真正要 smartValue 的时候才调用 plugin。
      if (!hasValue) pluginSmartValue.forEach(smartValue => smartValue(fieldName, propType))
    })

    // 如果 field 是非对象类型，delegateLeaf 就会生成 ref 形式的 reactive，保障格式一致。
    return delegateLeaf(values)[fieldName]
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

/****************
 * createUseForm
 ****************/
function createUseForm(...plugins) {
  return function useForm(props) {
    const {getInitialValues = () => ({})} = props
    // CAUTION 因为 createField 的时候有的 computed 已经用到了 values，但此时 values 可能还没有正确的引用。
    // 引用是在 smartProp 里面创建的。为了让这些 computed 能正确触发，因此直接将整个 value reactive 化。
    const values = reactive(getInitialValues())
    const setValues = (nextValues) => {
      // CAUTION 这里没有直接 replace 整个 values，是因为这里的 setValues 实际上是 patchValues，只对用户声明的进行修改。
      debounceComputed(() => {
        Object.entries(nextValues).forEach(([valueName, nextValue]) => {

          invariant(valueName in values, `${valueName} not exist. Keys: ${Object.keys(values).join(',')}`)
          // CAUTION 这里不要用 replace，因为 values 整体是 reactive，直接去下面的节点可能只是一个简单值，不是 reactive。
          // 当前这种写法无论 values[valueName] 是什么类型都能支持。并且不会影响传给组件的引用。
          // 因为，如果是简单值，那么传给组件的是 delegateLeaf 产生的 refLike 对象，其中持有的根引用是 values 本身，不会变。
          // 如果是对象，那么传给组件的是 reactive 对象。直接使用赋值会使引用丢失，所以使用 replace
          if (!(typeof values[valueName] === 'object')) {
            values[valueName] = nextValue
          } else {
            replace(values[valueName], nextValue)
          }

        })
      })
    }

    const pluginInstances = plugins.map(plugin => plugin(props, values, setValues))

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
      setValues,
    }

    pluginInstances.forEach(instance => {
      if (!instance.output) return
      const toAssign = typeof instance.output === 'function' ?
        instance.output(output):
        instance.output
      Object.assign(output, toAssign)
    })

    return output
  }
}

export default createUseForm(resetPlugin, dirtyCheckPlugin, validationPlugin, submitPlugin)
