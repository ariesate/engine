export const isArray = Array.isArray

export const merge = Object.assign

export const keys = Object.keys

export function isFunction(fn) {
  return typeof fn === 'function'
}

export function shallowClone(obj) {
  return isArray(obj) ? obj.slice() : merge({}, obj)
}

export function identity(key, value) {
  return value
}

const regex = /^@\d{1,}$/i

export function isObjectRef(key) {
  return regex.test(key)
}

export function getId(n) {
  return `@${n}`
}

export function isPrimitive(value) {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
}

export function isPrimitiveProperty(obj, prop) {
  return prop != null ? isPrimitive(obj[prop]) : p => isPrimitive(obj[p])
}

export function createObjectHandler(callback) {
  const memo = new Map()

  function objectHandler(key, value) {
    if (!memo.has(value)) memo.set(value, callback(key, value))

    return memo.get(value)
  }

  return isFunction(callback) ? objectHandler : identity
}
