export function isPromiseLike(obj) {
  return typeof obj.then === 'function' && typeof obj.catch === 'function'
}

export function cancelable(q) {
  let fnToCall = null
  return {
    then(fn) {
      fnToCall = fn
      return q.then((...args) => {
        if (typeof fnToCall === 'function') {
          fnToCall(...args)
        }
      })
    },
    cancel() {
      fnToCall = null
    },
    catch(fn) {
      return q.catch(fn)
    },
  }
}

export function escapeDot(str) {
  return str.replace(/\./g, '\\.')
}
