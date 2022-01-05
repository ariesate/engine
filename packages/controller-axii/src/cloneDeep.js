const getNativeType = (obj) => Object.prototype.toString.call(obj)

// 类型

/*
const getStringTag = (type) => `[object ${type}]`
const objectTypes = {
  string: getStringTag('String'),
  number: getStringTag('Number'),
  map: getStringTag('Map'),
  set: getStringTag('Set'),
  object: getStringTag('Object'),
  function: getStringTag('Function]'),
  reg: getStringTag('RegExp'),
  date: getStringTag('Date'),
  dataView: getStringTag('DataView'),
  array: getStringTag('Array'),
  blob: getStringTag('Blob'),
}
*/

// 判断
const isObjectString = (obj) => getNativeType(obj) === '[object String]' && typeof obj === 'object' && obj.charAt
const isObjectNumber = (obj) => getNativeType(obj) === '[object Number]' && typeof obj === 'object'
const isObjectBoolean = (obj) => getNativeType(obj) === '[object Boolean]' && typeof obj === 'object'
const isMap = (obj) => getNativeType(obj) === '[object Map]'
const isSet = (obj) => getNativeType(obj) === '[object Set]'
const isFunction = (obj) => getNativeType(obj) === '[object Function]'
const isRegExp = (obj) => getNativeType(obj) === '[object RegExp]'
const isDate = (obj) => getNativeType(obj) === '[object Date]'
const isDataView = (obj) => getNativeType(obj) === '[object DataView]'
const isArray = (obj) => Array.isArray(obj)
const isPlainObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
/**
 * 判断是否为 ArrayBuffer 以及 TypeArray 或 BigArray
 * @param obj {any} 用于判断的数据
 */
const isBufferOrBlobOTypeArrayOrBigArray = (obj) => /^\[object (((Big)?(Int|Uint|Float)\d+)?(Clamped|Shared)?Array(Buffer)?|Blob)\]$/.test(getNativeType(obj))
const isUndef = (obj) => obj === null || obj === undefined
// 复制
const copyObjectString = (strObj) => new String(strObj)
const copyObjectNumber = (numObj) => new Number(numObj)
const copyObjectBoolean = (boolObj) => new Boolean(boolObj.toString() === 'true')
const copyDate = (date) => new Date(date)
const copySet = (set) => new Set(set)
const copyMap = (map) => new Map(map)
const copyReg = (reg) => new RegExp(reg)
const copyFunction = (fn) => new Function('return ' + fn.toString())()
const copyDataView = (view) => new DataView(view.buffer.slice(0), view.byteOffset, view.byteLength)
const copyBufferOrBlobOTypeArrayOrBigArray = (arrLike) => arrLike.slice(0)
const deepCopyArray = (arr, typeToHandle) => {
  const newArr = []
  arr.forEach((item, index) => {
    newArr.push(deepCopy(item, newArr, index, typeToHandle))
  })
  return newArr
}
const deepCopyObject = (obj, typeToHandle) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj)
  const res = {}
  const keys = Object.keys(descriptors)
  keys.forEach((key) => {
    const descriptor = descriptors[key]
    if (!descriptor.writable || !descriptor.configurable || !descriptor.enumerable) {
      Object.defineProperty(res, key, Object.assign({}, descriptor, { value: deepCopy(descriptor.value, res, key) }))
    } else {
      res[key] = deepCopy(obj[key], res, key, typeToHandle)
    }
  })
  const symbols = Object.getOwnPropertySymbols(obj)
  symbols.forEach((symbol, i) => {
    res[symbol] = deepCopy(obj[symbol], res, symbol, typeToHandle)
  })
  return res
}

// core
let cacheList= []
let circleLinks = []
const deepCopy = (obj, target, key, typeToHandle) => {
  let catchItem = {
    original: obj,
    copy: void 0
  }
  const hit = cacheList.find(c => c.original === obj)
  if (hit) {
    catchItem = hit
    circleLinks.push({
      target,
      key,
      catchItem,
    })
    return hit.copy
  } else {
    cacheList.push(catchItem)
    if (isObjectString(obj)) {
      catchItem.copy = copyObjectString(obj)
    } else if (isObjectNumber(obj)) {
      catchItem.copy = copyObjectNumber(obj)
    } else if (isObjectBoolean(obj)) {
      catchItem.copy = copyObjectBoolean(obj)
    } else if (isSet(obj)) {
      catchItem.copy = copySet(obj)
    } else if (isMap(obj)) {
      catchItem.copy = copyMap(obj)
    } else if (isFunction(obj)) {
      catchItem.copy = copyFunction(obj)
    } else if (isPlainObject(obj)) {
      catchItem.copy = deepCopyObject(obj, typeToHandle)
    } else if (isArray(obj)) {
      catchItem.copy = deepCopyArray(obj, typeToHandle)
    } else if (isRegExp(obj)) {
      catchItem.copy = copyReg(obj)
    } else if (isDate(obj)) {
      catchItem.copy = copyDate(obj)
    } else if (isDataView(obj)) {
      catchItem.copy = copyDataView(obj)
    } else if (isBufferOrBlobOTypeArrayOrBigArray(obj)) {
      catchItem.copy = copyBufferOrBlobOTypeArrayOrBigArray(obj)
    } else if (isUndef(obj)) {
      catchItem.copy = obj;
    } else {
      const handle = typeToHandle.get(obj.constructor)
      catchItem.copy = handle ? handle(obj) : obj
    }
  }
  return catchItem.copy
}

export default function deepClone (obj, typeToHandle) {
  const res = deepCopy(obj, undefined, undefined, typeToHandle)
  circleLinks.forEach((item) => {
    item.target[item.key] = item.catchItem.copy
  })
  cacheList = []
  circleLinks = []
  return res
}