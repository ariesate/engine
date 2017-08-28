import { each } from '../../../util'
import { isPromiseLike, cancelable } from '../../common'
import {
  VALIDATION_TYPE_NORMAL,
  VALIDATION_TYPE_SUCCESS,
  VALIDATION_TYPE_WARNING,
  VALIDATION_TYPE_VALIDATING,
  VALIDATION_TYPE_ERROR,
} from '../../../constant'

export const priorities = [VALIDATION_TYPE_NORMAL, VALIDATION_TYPE_SUCCESS, VALIDATION_TYPE_WARNING, VALIDATION_TYPE_VALIDATING, VALIDATION_TYPE_ERROR]

export function createValidatingPromiseContainer() {
  const validatingPromises = {}
  return {
    initialize(id) {
      // CAUTION 如果已经有记录了，说明上一次异步还没处理完，这里又触发了一次，所以要取消掉上次的
      if (validatingPromises[id] && isPromiseLike(validatingPromises[id].finalPromise)) {
        validatingPromises[id].finalPromise.cancel()
        delete validatingPromises[id]
      }

      if (validatingPromises[id] === undefined) {
        validatingPromises[id] = {
          finalPromise: null,
          promises: [],
        }
      }
    },
    isInitialized(id) {
      return validatingPromises[id] !== undefined && validatingPromises[id].finalPromise === null
    },
    get(id) {
      return validatingPromises[id]
    },
    isValidating(id) {
      return validatingPromises[id] !== undefined
    },
    insert(id, promise) {
      if (validatingPromises[id].finalPromise !== null) {
        throw new Error(`${id} promise is not null, cannot insert new promise`)
      }
      validatingPromises[id].promises.push(promise)
    },
    createFinal(id, onSuccess, onError = (e) => { throw new Error(e) }) {
      if (validatingPromises[id].finalPromise !== null) {
        throw new Error(`${id} promise is not null, cannot set finale`)
      }
      validatingPromises[id].finalPromise = cancelable(Promise.all(validatingPromises[id].promises))
      validatingPromises[id].finalPromise.then((...arg) => {
        // 用 false 表示执行过了
        delete validatingPromises[id]
        return onSuccess(...arg)
      }).catch((e) => {
        delete validatingPromises[id]
        onError(e)
      })
    },
    forEach(handler) {
      each(validatingPromises, handler)
    },
    remove(id) {
      delete validatingPromises[id]
    },
  }
}

export function createValidationState() {
  const validationState = {}
  const keyToSessionId = {}

  function isPriorTo(a, b) {
    return priorities.indexOf(a) > priorities.indexOf(b)
  }

  return {
    replace(key, result) {
      if (validationState[key] === undefined || isPriorTo(result.type, validationState[key].type)) {
        // 如果执行出来的结果比当前的优先级高
        validationState[key] = result
        return true
      }
      return false
    },
    remove(key) {
      delete validationState[key]
    },
    get(key) {
      return validationState[key]
    },
    set(key, result) {
      validationState[key] = result
    },
    isTop(key) {
      return validationState[key].type === priorities[priorities.length - 1]
    },
    forEach(handler) {
      each(validationState, handler)
    },
    batchUpdate(batchResult) {
      Object.assign(validationState, batchResult)
    },
    toObject() {
      return validationState
    },
    reset(key, sessionId) {
      if (sessionId !== keyToSessionId[key]) {
        keyToSessionId[key] = sessionId
        validationState[key] = {}
      }
    },
  }
}

export function createOneToManyContainer() {
  const map = {}
  return {
    insert(key, value) {
      if (map[key] === undefined) map[key] = []
      map[key].push(value)
    },
    get(key) {
      return map[key]
    },
    includes(key, item) {
      return map[key] === undefined ? false : map[key].includes(item)
    },
    remove(key, item) {
      map[key] = map[key].filter(i => (typeof item === 'function' ? item(i) : i !== item))
      if (map[key].length === 0) delete map[key]
    },
    removeAll(key) {
      delete map[key]
    },
  }
}

export function pickResult(results) {
  return results.reduce((lastResult, current) => (priorities.indexOf(lastResult.type) > priorities.indexOf(current.type) ? lastResult : current), {})
}
