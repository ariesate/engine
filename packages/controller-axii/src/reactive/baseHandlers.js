import {reactive, toRaw, isAtom, isReactive} from './reactive'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { track, trigger, ITERATE_KEY, debounceComputed } from './effect'
import { isObject, hasOwn, isSymbol, hasChanged } from './util'

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(isSymbol)
)

const get = createGetter()

const debouncedArrayMethods = ['unshift', 'push', 'splice']

function createDebouncedMethod(method) {
  return function(...argv) {
    let result
    debounceComputed(() => {
      result = method.call(this, ...argv)
    })
    return result
  }
}

/**
 * 数组的 unshift/push/splice 都可能引起多次 add 和 set，需要 debounce 一下？否则可能引起 computed 无意义的多次变化。
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    if (isSymbol(key) && builtInSymbols.has(key)) {
      return res
    }

    // CAUTION 下面的 setter 允许了可以指向 atom，但是不能指向 reactive。
    // CAUTION 在vue3 中是把 atom 给拆了，但 axii 中默认 atom 是基本数据结构，所以不拆。
    if (isAtom(res)) {
      return res
    }

    // 如果是数组需要 debounced 的操作
    if (Array.isArray(target) && debouncedArrayMethods.includes(key)) {
      return createDebouncedMethod(res)
    }

    track(target, TrackOpTypes.GET, key)
    return isObject(res)
      ? reactive(res)
      : res
  }
}

const set = /*#__PURE__*/ createSetter()

function createSetter() {
  return function set(
    target,
    key,
    value,
    receiver
  ) {

    // debugger
    const oldValue = target[key]
    // CAUTION reactive 下面不允许嵌套 reactive，但是可以指向 atom。所以这里是用严格 isReactive 判断。
    //  要注意上面的 getter 也判断了是不是 atom，如果是，不要生成新的 reactive proxy.
    const rawValue = isReactive(value) ? toRaw(value) : value
    const hadKey = hasOwn(target, key)
    let result = true
    try {
      Reflect.set(target, key, rawValue, receiver)
    } catch(e) {
      console.error(e)
      result = false
    }
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      /* istanbul ignore else */
      const extraInfo = { oldValue, newValue: rawValue }
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, extraInfo)
      } else {
        // 在这里不处理性能优化，所有有操作都通知外面。用参数告诉外面变化了没有
        trigger(target, TriggerOpTypes.SET, key, !hasChanged(oldValue, rawValue))
      }
    }
    return result
  }
}

function deleteProperty(target, key) {
  const hadKey = hasOwn(target, key)
  const oldValue = target[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    /* istanbul ignore else */
    if (__DEV__) {
      trigger(target, TriggerOpTypes.DELETE, key, { oldValue })
    } else {
      trigger(target, TriggerOpTypes.DELETE, key)
    }
  }
  return result
}

function has(target, key) {
  const result = Reflect.has(target, key)
  track(target, TrackOpTypes.HAS, key)
  return result
}

function ownKeys(target) {
  track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
  return Reflect.ownKeys(target)
}

export const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
