import exist from 'exist.js'

/* eslint-disable no-useless-escape */
const rxAccess = /[\[\]\.]+/
/* eslint-enable no-useless-escape */

export default {
  ...exist,
  set(obj, inputPath, ...argv) {
    const path = Array.isArray(inputPath) ? inputPath.slice() : inputPath
    return exist.set(obj, path, ...argv)
  },
  get(obj, path, defaultValue) {
    return (path === '' || path === undefined || (Array.isArray(path) && path.length === 0)) ? obj : exist.get(obj, path, defaultValue)
  },
  ensure(obj, path, value) {
    if (exist.detect(obj, path) !== true) {
      exist.set(obj, path, value, true)
    }
  },
  assign(obj, path, newValue) {
    const origin = exist.get(obj, path)
    if (origin === undefined) {
      exist.set(obj, path, newValue)
    } else {
      Object.assign(origin, newValue)
    }
  },
  split(path) {
    return path.split(rxAccess)
  },
  remove(obj, path) {
    const arr = Array.isArray(path) ? path : path.split(rxAccess)
    const base = arr.length > 1 ? exist.get(obj, arr.slice(0, arr.length - 1)) : obj
    delete base[arr[arr.length - 1]]
  },
}
