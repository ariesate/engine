
export function makeMap(str, expectsLowerCase) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}

export function isObject(val) {
  return val !== null && typeof val === 'object'
}

export function toRawType(value) {
  return toTypeString(value).slice(8, -1)
}

export const objectToString = Object.prototype.toString

function toTypeString(value) {
  return objectToString.call(value)
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(val, key){
  return hasOwnProperty.call(val, key)
}

export function isSymbol(value) {
  return typeof value === 'symbol'
}

export function hasChanged(value, oldValue) {
  // ? 后面这一段是什么
  return value !== oldValue && (value === value || oldValue === oldValue)
}

export function isArray(arr) {
  return Array.isArray(arr)
}

export const EMPTY_OBJ = {}


function cacheStringFunction(fn) {
  const cache = Object.create(null)
  return ((str) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  })
}

export const capitalize = cacheStringFunction((str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
)

export function NOOP() {

}

export function isFunction(fn) {
  return typeof fn === 'function'
}

export function createIdGenerator() {
  let id = 1
  return () => {
    return String(id++)
  }
}

export function pushToSet(set, arrayOrSet) {
  arrayOrSet.forEach(item => set.add(item))
}

export function insertIntoOrderedArray(array, item, findPlace) {
  const inserted = array.some((current, index) => {
    if (findPlace(current, item)) {
      array.splice(index, 0, item)
      return true
    }
  })

  if (!inserted) array.push(item)
}

export function filterOut(list, itemsToFilter) {
  if (!itemsToFilter.length ) return []

  let i = 0
  const filteredItems = []
  if (itemsToFilter)
  while(list[i]) {
    if (itemsToFilter.includes(list[i])){
      filteredItems.push(list[i])
      list.splice(i, 1)
    } else {
      i++
    }
  }
  return filteredItems
}

export function isPlainObject(value) {
  return (typeof value === 'object') && (Object.getPrototypeOf(value) === null || Object === value.constructor)
}
