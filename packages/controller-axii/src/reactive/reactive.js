import { isObject, toRawType, makeMap, hasChanged } from './util'
import {
  mutableHandlers,
} from './baseHandlers'
import {
  mutableCollectionHandlers,
} from './collectionHandlers'
import { track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';

// WeakMaps that store {raw <-> observed} pairs.
const rawToReactive = new WeakMap()
const reactiveToRaw = new WeakMap()

const collectionTypes = new Set([Set, Map, WeakMap, WeakSet])
const isObservableType = /*#__PURE__*/ makeMap(
  'Object,Array,Map,Set,WeakMap,WeakSet'
)

const canObserve = (value) => {
  return isObservableType(toRawType(value))
}

export function reactive(target) {
  return createReactiveObject(
    target,
    rawToReactive,
    reactiveToRaw,
    mutableHandlers,
    mutableCollectionHandlers
  )
}


function createReactiveObject(
  target,
  toProxy,
  toRaw,
  baseHandlers,
  collectionHandlers
) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }
  // target already has corresponding Proxy
  let observed = toProxy.get(target)
  if (observed !== void 0) {
    return observed
  }
  // target is already a Proxy
  if (toRaw.has(target)) {
    return target
  }
  // only a whitelist of value types can be observed.
  if (!canObserve(target)) {
    return target
  }
  const handlers = collectionTypes.has(target.constructor)
    ? collectionHandlers
    : baseHandlers
  observed = new Proxy(target, handlers)
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  return observed
}

export function isReactive(value) {
  return reactiveToRaw.has(value)
}


export function toRaw(observed) {
  return reactiveToRaw.get(observed) || observed
}

/**************************
 * ref
 **************************/

export function isRef(r, strict){
  if (!r) return false
  return strict ? r._isRef === true : (r._isRef === true || r._isRefLike === true)
}

// 用于伪造 refLike 的数据，可以通过 isRef 的校验
// 框架里面需要保持数据格式一致，例如组件既可以接受 ref，也可以接受固定值，所以有这个需求。
export function refLike(value) {
  return {
    _isRefLike: true,
    value
  }
}

export function ref(raw) {
  if (isRef(raw)) {
    return raw
  }
  // CAUTION  取消了 convert。
  const r = {
    _isRef: true,
    get value() {
      track(r, TrackOpTypes.GET, 'value')
      return raw
    },
    set value(newVal) {
      const isUnChanged = !hasChanged(toRaw(raw), newVal)
      raw = newVal

      trigger(
        r,
        TriggerOpTypes.SET,
        'value',
        isUnChanged
      )
    }
  }

  return r
}

export function toRefs( object) {
  if (__DEV__ && !isReactive(object)) {
    console.warn(`toRefs() expects a reactive object but received a plain one.`)
  }
  const ret= {}
  for (const key in object) {
    ret[key] = toProxyRef(object, key)
  }
  return ret
}

function toProxyRef(object, key) {
  return {
    _isRef: true,
    get value() {
      return object[key]
    },
    set value(newVal) {
      object[key] = newVal
    }
  }
}

