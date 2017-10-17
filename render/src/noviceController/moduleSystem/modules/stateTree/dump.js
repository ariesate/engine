import {
  isArray,
  getId,
  isPrimitiveProperty,
  isPrimitive,
  isFunction,
  createObjectHandler,
  shallowClone,
  keys,
  isObjectRef,
} from './utils'

export function dump(root, options) {
  const serialized = {}
  const unprocessed = []
  const identities = new Map()
  let id = 0
  const key = getId(id)
  const handler = createObjectHandler(options && options.serializer)

  const serializer = function (k, value) {
    const result = handler(k, value)

    if (result instanceof Map) return { entries: [...result], __dump__: 'ES6Map' }

    if (result instanceof Set) return { values: [...result], __dump__: 'ES6Set' }

    return result
  }

  function generateObjId(obj, prop) {
    const value = obj[prop]
    let objId

    if (!identities.has(value)) {
      objId = getId(++id)
      identities.set(value, objId)
      unprocessed.push([value, objId])
    } else {
      objId = identities.get(value)
    }

    return objId
  }

  function destruct(obj) {
    return function (result, item, index) {
      const prop = isArray(result) ? index : item

      obj = shallowClone(obj)
      obj[prop] = serializer(prop, obj[prop])

      if (isFunction(obj[prop])) return result
      if (obj[prop] === undefined) return result

      if (isPrimitiveProperty(obj, prop)) {
        result[prop] = obj[prop]
      } else {
        result[prop] = generateObjId(obj, prop)
      }

      return result
    }
  }

  function _dump(obj, identifier) {
    if (!identities.has(obj)) identities.set(obj, identifier)

    const data = isArray(obj) ? obj : Object.keys(obj)
    return data.reduce(destruct(obj), isArray(obj) ? [] : {})
  }

  if (root == null) return

  serialized[key] = _dump(root, key)

  // CAUTION 这样写是因为 unprocessed 会在循环中持续添加
  /* eslint-disable no-restricted-syntax */
  for (const [obj, identifier] of unprocessed) {
  /* eslint-enable no-restricted-syntax */
    serialized[identifier] = _dump(obj, identifier)
  }

  return JSON.stringify(serialized)
}

function createPropHandler(item, visited, deserializer) {
  return function propertyHandler(prop) {
    const propDescriptor = Object.getOwnPropertyDescriptor(item, prop)

    if ('set' in propDescriptor && propDescriptor.set == null) return
    if (propDescriptor.writable === false) return

    // TODO if returned value didn't changed, don't assign it
    item[prop] = deserializer(prop, item[prop])

    if (!visited.has(item[prop])) visited.add(item[prop])
  }
}

export function restore(data, options) {
  const visited = new Set()
  const handler = createObjectHandler(options && options.deserializer)
  const source = JSON.parse(data)
  const keysList = keys(source)

  function deserializer(key, value) {
    const result = handler(key, value)

    if (result != null && result.__dump__ === 'ES6Map') {
      return new Map(result.entries)
    }

    if (result != null && result.__dump__ === 'ES6Set') {
      return new Set(result.values)
    }

    return result
  }

  if (keysList.length === 0) return source

  keysList.forEach((key) => {
    const obj = source[key]
    keys(obj)
      .filter(k => isObjectRef(obj[k]))
      .forEach(k => obj[k] = source[obj[k]])
  })

  keys(source['@0']).forEach(createPropHandler(source['@0'], visited, deserializer))

  /* eslint-disable no-restricted-syntax */
  for (const item of visited) {
  /* eslint-enable no-restricted-syntax */

    if (item == null || isPrimitive(item) || Object.isFrozen(item)) continue

    if (item instanceof Map) {
      const mapEntries = [...item.entries()]
      item.clear()
      /* eslint-disable no-restricted-syntax */
      for (const [key, value] of mapEntries) {
      /* eslint-enable no-restricted-syntax */

        const transformedKey = deserializer(0, key)
        const transformedValue = deserializer(1, value)

        item.set(transformedKey, transformedValue)
        if (!visited.has(transformedKey)) visited.add(transformedKey)
        if (!visited.has(transformedValue)) visited.add(transformedValue)
      }
    } else if (item instanceof Set) {
      const setEntries = [...item.entries()]
      item.clear()
      /* eslint-disable no-restricted-syntax */
      for (const [key, value] of setEntries) {
      /* eslint-enable no-restricted-syntax */

        const transformed = deserializer(key, value)
        item.add(transformed)
        if (!visited.has(transformed)) visited.add(transformed)
      }
    } else {
      keys(item).forEach(createPropHandler(item, visited, deserializer))
    }
  }
  return source['@0']
}
