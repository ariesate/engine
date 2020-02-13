import { toRaw, reactive } from './reactive'
import { track, trigger, ITERATE_KEY } from './effect'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { isObject, hasOwn, hasChanged } from './util'


const toReactive = (value) => isObject(value) ? reactive(value) : value

const getProto = (v) => Reflect.getPrototypeOf(v)

function get(target, key, wrap) {
  target = toRaw(target)
  key = toRaw(key)
  track(target, TrackOpTypes.GET, key)
  return wrap(getProto(target).get.call(target, key))
}

function has(key) {
  const target = toRaw(this)
  key = toRaw(key)
  track(target, TrackOpTypes.HAS, key)
  return getProto(target).has.call(target, key)
}

function size(target) {
  target = toRaw(target)
  track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
  return Reflect.get(getProto(target), 'size', target)
}

function add(value) {
  value = toRaw(value)
  const target = toRaw(this)
  const proto = getProto(target)
  const hadKey = proto.has.call(target, value)
  const result = proto.add.call(target, value)
  if (!hadKey) {
    /* istanbul ignore else */
    if (__DEV__) {
      trigger(target, TriggerOpTypes.ADD, value, { newValue: value })
    } else {
      trigger(target, TriggerOpTypes.ADD, value)
    }
  }
  return result
}

function set(key, value) {
  value = toRaw(value)
  const target = toRaw(this)
  const proto = getProto(target)
  const hadKey = proto.has.call(target, key)
  const oldValue = proto.get.call(target, key)
  const result = proto.set.call(target, key, value)
  const extraInfo = { oldValue, newValue: value }
  if (!hadKey) {
    trigger(target, TriggerOpTypes.ADD, key, extraInfo)
  } else {
    // CAUTION 要不要判断 hasChanged ，让 effect 决定。
    trigger(target, TriggerOpTypes.SET, key, !hasChanged(oldValue, value))
  }
  return result
}

function deleteEntry(key) {
  const target = toRaw(this)
  const proto = getProto(target)
  const hadKey = proto.has.call(target, key)
  const oldValue = proto.get ? proto.get.call(target, key) : undefined
  // forward the operation before queueing reactions
  const result = proto.delete.call(target, key)
  if (hadKey) {
    /* istanbul ignore else */
    if (__DEV__) {
      trigger(target, TriggerOpTypes.DELETE, key, { oldValue })
    } else {
      trigger(target, TriggerOpTypes.DELETE, key)
    }
  }
  return result
}

function clear() {
  const target = toRaw(this)
  const hadItems = target.size !== 0
  const oldTarget = __DEV__
    ? target instanceof Map
      ? new Map(target)
      : new Set(target)
    : undefined
  // forward the operation before queueing reactions
  const result = getProto(target).clear.call(target)
  if (hadItems) {
    /* istanbul ignore else */
    if (__DEV__) {
      trigger(target, TriggerOpTypes.CLEAR, void 0, { oldTarget })
    } else {
      trigger(target, TriggerOpTypes.CLEAR)
    }
  }
  return result
}

function createForEach() {
  return function forEach(
    callback,
    thisArg
  ) {
    const observed = this
    const target = toRaw(observed)
    const wrap = toReactive
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
    // important: create sure the callback is
    // 1. invoked with the reactive map as `that` and 3rd arg
    // 2. the value received should be a corresponding reactive/readonly.
    function wrappedCallback(value, key) {
      return callback.call(observed, wrap(value), wrap(key), observed)
    }
    return getProto(target).forEach.call(target, wrappedCallback, thisArg)
  }
}

function createIterableMethod(method) {
  return function(...args) {
    const target = toRaw(this)
    const isPair =
      method === 'entries' ||
      (method === Symbol.iterator && target instanceof Map)
    const innerIterator = getProto(target)[method].apply(target, args)
    const wrap = toReactive
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
    // return a wrapped iterator which returns observed versions of the
    // values emitted from the real iterator
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next()
        return done
          ? { value, done }
          : {
              value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
              done
            }
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this
      }
    }
  }
}


const mutableInstrumentations = {
  get(key) {
    return get(this, key, toReactive)
  },
  get size() {
    return size(this)
  },
  has,
  add,
  set,
  delete: deleteEntry,
  clear,
  forEach: createForEach(false)
}

const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator]
iteratorMethods.forEach(method => {
  mutableInstrumentations[method] = createIterableMethod(
    method,
    false
  )
})

function createInstrumentationGetter(instrumentations) {
  return (
    target,
    key,
    receiver
  ) =>
    Reflect.get(
      hasOwn(instrumentations, key) && key in target
        ? instrumentations
        : target,
      key,
      receiver
    )
}

export const mutableCollectionHandlers = {
  get: createInstrumentationGetter(mutableInstrumentations)
}

