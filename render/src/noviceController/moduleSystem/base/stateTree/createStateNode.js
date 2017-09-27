/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-use-before-define */
import { each } from '../../../../util'
import { EVENT_POP, EVENT_PUSH, EVENT_UNSHIFT, EVENT_SHIFT } from './constant'

/**
 * Observable 要支持两种监听模式:
 *
 * 1. 组件级别的监听，组件不管具体是哪个字段改变，只要改变就更新。
 *  这种情况实际上只要设置 setter 就行了。
 *
 * 2. 字段级别的更新，这个主要是 mapBackgroundToState、visible、interpolation
 *  三个机制需要。这种情况需要监听字段的 getter。
 *
 *  监听时还要考虑到递归的问题:
 *
 *  1. 对象类型的监听。
 *  2. 数组类型的监听。
 *
 *  Observable 还要考虑 background 的数据记录需求:
 *  Background 可能会要构造和 stateTree 一样的数据结构，当 stateTree
 *  整体结构发生变化时，如何告知 background ？以 validation 为例。
 *  validation 需要构造:
 *  1. validator。
 *  2. validateState。validator 的输出结果。
 *
 *  当 stateTree 结构发生变化时:
 *  1. validator 要删掉。(set 的时候注意一下，数组 remove，重新赋值，都检查一次！) 。
 *  2. **validateState 中对应的状态不要"重新计算"！**
 *  3. isValid 需要重新计算，能力由第三方提供，可以提供更好的 cache 来防止 map 和 visible 等重复运行。
 */

function defineMethod(obj, key, fn) {
  Object.defineProperty(obj, key, {
    value: fn,
  })
}

function defineGetter(obj, key, getter) {
  Object.defineProperty(obj, key, {
    get: getter,
  })
}

function defineValue(obj, key, value) {
  Object.defineProperty(obj, key, {
    value,
  })
}

export default function createStateNode(initialState, onChange) {
  const stateNode = {}

  defineMethod(stateNode, '_onChange', onChange)
  defineMethod(stateNode, '_getPath', () => [])
  defineValue(stateNode, '_isStateNode', true)

  each(initialState, (value, k) => {
    const observableValue = createObservableValue(stateNode, k, value, stateNode)
    attachObservableValue(stateNode, k, observableValue, stateNode)
  })

  return stateNode
}

function attachObservableValue(objToAttach, key, inputValue, stateNode, allowDelete) {
  let value = inputValue
  Object.defineProperty(objToAttach, key, {
    get() {
      return value
    },
    set(next) {
      value = createObservableValue(objToAttach, key, next, stateNode)
      const parentPath = objToAttach._isStateNode ? [] : objToAttach._getPath()
      stateNode._onChange(parentPath.concat(key))
    },
    enumerable: true,
    configurable: allowDelete,
  })
}

function createObservableValue(parent, selfKey, value, stateNode) {
  if (typeof value !== 'object') return value

  if (value._isStateNode) {
    return value
  }

  if (value._isObservable) {
    value._setParent(parent)
    value._setKey(selfKey)
    return value
  }

  if (Array.isArray(value)) return createObservableArray(parent, selfKey, value, stateNode)
  return createObservableObject(parent, selfKey, value, stateNode)
}

function createObservableObject(inputParent, inputKey, ObjectValue, stateNode) {
  const result = {}
  let key = inputKey
  let parent = inputParent

  defineMethod(result, '_getPath', function getPath() { return parent._getPath().concat(key) })

  defineMethod(result, '_setKey', function getPath(newKey) { key = newKey })

  defineMethod(result, '_setParent', function setParent(newParent) { parent = newParent })

  defineGetter(result, '_parent', function getParent() { return parent })

  each(ObjectValue, (v, k) => {
    const observableValue = createObservableValue(result, k, v, stateNode)
    attachObservableValue(result, k, observableValue, stateNode)
  })

  return result
}

function createObservableArray(inputParent, inputKey, inputArray, stateNode) {
  const result = {}
  let key = inputKey
  let parent = inputParent
  const arrayHolder = []

  defineMethod(result, '_getPath', function getPath() { return parent._getPath().concat(key) })

  defineMethod(result, '_setKey', function setKey(newKey) { key = newKey })

  defineMethod(result, '_setParent', function setParent(newParent) { parent = newParent })

  defineGetter(result, '_parent', function getParent() { return parent })

  defineValue(result, '_isObservableArray', true)

  defineGetter(result, 'length', function length() { return arrayHolder.length })

  inputArray.forEach((v, k) => {
    const observableValue = createObservableValue(result, String(k), v, stateNode)
    arrayHolder.push(observableValue)
    attachProxyArrayKey(result, String(k), arrayHolder, stateNode)
  })

  defineMethod(result, 'push', function push(item) {
    const observableValue = createObservableValue(result, String(arrayHolder.length), item, stateNode)
    attachProxyArrayKey(result, String(arrayHolder.length), arrayHolder, stateNode)
    arrayHolder.push(observableValue)
    stateNode._onChange(EVENT_PUSH, parent._getPath().concat(key))
  })

  defineMethod(result, 'pop', function pop() {
    delete result[arrayHolder.length - 1]
    arrayHolder.pop()
    stateNode._onChange(EVENT_POP, parent._getPath().concat(key))
  })

  defineMethod(result, 'unshift', function unshift(item) {
    const observableValue = createObservableValue(result, '0', item, stateNode)
    attachProxyArrayKey(result, String(arrayHolder.length), arrayHolder, stateNode)
    arrayHolder.unshift(observableValue)
    arrayHolder.slice(1).forEach((o, index) => {
      if (typeof o === 'object') {
        o._setKey(String(index))
      }
    })
    stateNode._onChange(EVENT_UNSHIFT, parent._getPath().concat(key))
  })

  defineMethod(result, 'shift', function unshift() {
    delete result[arrayHolder.length - 1]
    arrayHolder.shift()
    arrayHolder.forEach((o, index) => {
      if (typeof o === 'object') {
        o._setKey(String(index))
      }
    })
    stateNode._onChange(EVENT_SHIFT, parent._getPath().concat(key))
  })

  defineMethod(result, 'map', function map(...arg) {
    return arrayHolder.map(...arg)
  })

  defineMethod(result, 'slice', function map(...arg) {
    return arrayHolder.slice(...arg)
  })

  defineMethod(result, 'concat', function map(...arg) {
    return arrayHolder.concat(...arg)
  })

  return result
}

function attachProxyArrayKey(objToAttach, key, arrayToProxy, stateNode) {
  Object.defineProperty(objToAttach, key, {
    get() {
      return arrayToProxy[key]
    },
    set(next) {
      arrayToProxy[key] = createObservableValue(objToAttach, key, next, stateNode)
      stateNode._onChange(objToAttach._getPath().concat(key))
    },
    configurable: true,
    enumerable: true,
  })
}
