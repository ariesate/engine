import {
  propTypes,
  createElement,
  Fragment,
  atom,
  reactive,
  createComponent,
  atomComputed,
  computed,
  createSmartProp,
  delegateLeaf,
  tryToRaw,
  invariant,
  debounceComputed,
  shallowEqual,
  replace,
  isAtom
} from 'axii';
import { chain, hasConflict, mapValues } from '../util';
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
        changed: atomComputed(() => {
          return !equalFn(fieldName, initialValues[fieldName], values[fieldName])
        })
      }
    },
    output: {
      isChanged: atomComputed(() => {
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

function validationPlugin({ scheme }, values) {
  if (!scheme) return {}

  const tryToValidate = (changedFieldName, { value: nextValue }, { value }, ruleNames = [], callFromManual = false) => {
    // CAUTION 这里修改了一下格式，因为验证函数没有必要知晓 ref 的格式
    const nextRawValue = isAtom(value) ? nextValue.value : nextValue
    const rulesOfField = scheme[changedFieldName]
    if (!rulesOfField) return

    debounceComputed(() => {
      // 分类，先执行本地的，在执行 async 的。如果本地的没执行通过，后面的都不用执行了。
      const syncRules = {}
      const asyncRules = {}
      Object.entries(rulesOfField).forEach(([ruleName, ruleFn]) => {
        if (ruleNames.length && !ruleNames.includes(ruleName)) return

        if (ruleFn.constructor.name === 'AsyncFunction') {
          asyncRules[ruleName] = ruleFn
        } else {
          syncRules[ruleName] = ruleFn
        }
      })

      // TODO 要拿到其他 value 怎么办？？？例如 password 双校验这种
      let hasErrorInSyncRules = false
      for(let ruleName in syncRules) {
        const ruleFn = syncRules[ruleName]
        const result = ruleFn(nextRawValue, value, { fieldName: changedFieldName, values })
        validationResultByFieldName[changedFieldName][ruleName] = result.passed === true
        errorsByFieldName[changedFieldName][ruleName].splice(0, errorsByFieldName[changedFieldName][ruleName].length, ...(result.passed ? [] : result.errors))
        hasErrorInSyncRules = result.passed !== true
      }

      // sync rule 有问题，直接退出
      if (hasErrorInSyncRules) return

      Object.entries(asyncRules).forEach(([ruleName, ruleFn]) => {
        if (ruleNames.length && !ruleNames.includes(ruleName)) return
        const result = ruleFn(nextRawValue, value, { fieldName: changedFieldName, values })
          // 注意在发送时、发送失败并不清空上一次的 error 等状态。只有在成功时才修改。
        validationStatusByFieldName[changedFieldName][ruleName] = VALIDATION_STATUS_PENDING
        result.then(({ passed, errors }) => {
          invariant(passed ? true : (errors && errors.length), `failed rule ${ruleName} must have errors in result.` )
          debounceComputed(() => {
            validationStatusByFieldName[changedFieldName][ruleName] = VALIDATION_STATUS_NONE
            validationResultByFieldName[changedFieldName][ruleName] = passed
            errorsByFieldName[changedFieldName][ruleName].splice(0, errorsByFieldName[changedFieldName][ruleName].length, ...(passed ? [] : errors))
          })
        }).catch(() => {
          validationStatusByFieldName[changedFieldName][ruleName] = VALIDATION_STATUS_ERROR
        })
      })
    })
  }

  const errorsByFieldName = reactive({})
  const validationResultByFieldName = reactive({})
  const validationStatusByFieldName = reactive({})

  // TODO 可以通过 proxy，在读时在创建 output 中的 computed。
  return {
    state: {
      errorsByFieldName,
      validationResultByFieldName,
    },
    createField: (fieldName) => {
      if(!(fieldName in errorsByFieldName)) errorsByFieldName[fieldName] = mapValues(scheme[fieldName], () => [])
      if(!(fieldName in validationResultByFieldName)) validationResultByFieldName[fieldName] = mapValues(scheme[fieldName], () => undefined)
      if(!(fieldName in validationStatusByFieldName)) validationStatusByFieldName[fieldName] = mapValues(scheme[fieldName], () => undefined)

      const validate = (...ruleNames) => (draftProps, props) => tryToValidate(fieldName, draftProps, props, ruleNames)
      // 增加快捷的方法
      const rules = scheme[fieldName]
      Object.keys(rules).forEach((ruleName) => {
        validate[ruleName] = (draftProps, props) => tryToValidate(fieldName, draftProps, props, ruleName)
      })

      return {
        // 默认每个 field 都可以有多个验证条件，errors 记录每一个条件的结果
        errorsByRule: errorsByFieldName[fieldName],
        errors: computed(() => {
          return [].concat(...Object.values(errorsByFieldName[fieldName]))
        }),
        validateStatus: validationStatusByFieldName[fieldName],
        // 语法糖，validateStatus 其实已经可以判断
        isValidating: atomComputed(() => {
          return Object.values(validationStatusByFieldName[fieldName]).some(status => status === VALIDATION_STATUS_PENDING)
        }),
        validate,
        isValid: atomComputed(() => {
          return Object.values(validationResultByFieldName[fieldName]).every(passed => passed === true)
        }),
      }
    },
    output: {
      // 有一个是 error，整体就是 false。此外，有一个 undefined，就是 undefined。最后没有 error 也没有 undefined 才是 valid。
      isValid: atomComputed(() => {
        let hasUndefined = false
        // TODO 潜在的性能问题，准备解决。可能要从 debouncedComputed 考虑
        // console.log(Object.keys(validationResultByFieldName))
        for( let resultByRules of Object.values(validationResultByFieldName)) {
          for (let ruleResult of Object.values(resultByRules)) {
            // 有任何错误直接返回
            if (ruleResult === false) return false
            // 如果是有 undefined 先记着，最后如果没有因为 error 返回，那么再作为 undefined 返回
            if (ruleResult === undefined) hasUndefined = true
          }
        }
        // 如果没有 error，那么就看有没有 undefined。
        return hasUndefined ? undefined : true
      }),
      hasError: atomComputed(() => {
        // 虽然前面确保了只要有没 pass， 就一定有 error，但是这里是用 validationResultByRuleName 还是更保险。
        return Object.values(errorsByFieldName).some((errorsByRules) => {
          return Object.values(errorsByRules).some(errors => errors.length)
        })
      }),
      validate() {
        // TODO 手动执行
        debounceComputed(() => {
          Object.entries(values).forEach(([valueName, value]) => {
            tryToValidate(valueName, { value }, { value }, [], true)
          })
        })

      },
      resetValidation() {
        debounceComputed(() => {
          Object.keys(validationResultByFieldName).forEach(key => {
            validationResultByFieldName[key] = undefined
          })

          Object.keys(validationStatusByFieldName).forEach(key => {
            validationStatusByFieldName[key] = undefined
          })

          Object.values(errorsByFieldName).forEach(errorsByRules => {
            return Object.values(errorsByRules).forEach(errors => errors.splice(0))
          })
        })
      }
    }
  }
}

export function simpleScheme(fieldToRules) {
  return fieldToRules
}

// 基本的 rule
simpleScheme.required = (asEmpty = [undefined, '']) => {
  // 默认只检测 undefined 和 空字符串，用户可以自定义
  return (nextValue, preValue, { fieldName }) => {
    let error
    asEmpty.some((isEmpty) => {
      if (typeof isEmpty === 'function') {
        const result = isEmpty(nextValue)
        if (result) {
          error = result
        }
      } else {
        if (nextValue === isEmpty) {
          error = `${fieldName} cannot be ${JSON.stringify(isEmpty)}`
        }
      }
    })

    return { passed: error === undefined, errors: error ? [error]: [] }
  }
}

simpleScheme.range = (from, to, excludeFrom, excludeTo) => {
  return (nextValue, preValue, { fieldName }) => {
    invariant(!isNaN(nextValue), `${fieldName} is not a number, cannot use range rule to validate.`)
    if (from !== undefined && (excludeFrom ? (nextValue <= from) : (nextValue < from))) {
      return { errors: [`${fieldName} cannot be smaller than ${from}`] }
    }
    if (to !== undefined && (excludeTo ? (nextValue >= to) : (nextValue > to))) {
      return { errors: [`${fieldName} cannot be larger than ${to}`] }
    }
    return { passed: true }
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
  const submitStatus = atom(SUBMIT_STATUS_NONE)
  const isSubmitting = atomComputed(() => submitStatus.value === SUBMIT_STATUS_PENDING)
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
          debounceComputed(() => {
            target[fieldName] = createNamedFieldProxy(fieldName, values, pluginInstances)
          })
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
