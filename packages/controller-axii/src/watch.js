import {createComputed, isReactiveLike, isAtom, destroyComputed} from './reactive';
import { TYPE } from './reactive/effect';
import { deferred } from "./util";


export default function watch(computation, callback, runAtOnce) {
  let result
  let isFirstRun = true
  const token = createComputed((lastValue, watchAnyMutation) => {
    if (isFirstRun) {
      result = computation(watchAnyMutation)
      isFirstRun = false
      if (runAtOnce) callback(result)
    } else {
      computation(watchAnyMutation)
      callback(result)
    }
  }, TYPE.TOKEN)
  return [result, token]
}

export function traverse(obj) {
  if (!isReactiveLike(obj)) return

  if (isAtom(obj)) return obj.value

  // 这个写法对数组和对象都支持
  for(let i in obj) {
    // CAUTION 不管 obj[i] 是什么，有了这个判断就算读了。
    if (obj.hasOwnProperty(i) && typeof obj[i] === 'object') {
      traverse(obj[i])
    }
  }
}

export function watchOnce(computation, callback, runAtOnce) {
  let result
  let isFirstRun = true
  let triggered = false
  const token = createComputed((lastValue, watchAnyMutation) => {
    if (triggered) return

    if (isFirstRun) {
      result = computation(watchAnyMutation)
      isFirstRun = false
      if (runAtOnce) callback(result)
    } else {
      callback(result)
      // 还是用 triggered 标记一下，防止跑多次。
      triggered  = true
      deferred(() => {
        destroyComputed(token)
      })
    }
  }, TYPE.TOKEN)
  return [result, token]
}

export function watchReactive(data, callback, runAtOnce) {
  const [_, token] = watch(() => traverse(data), callback, runAtOnce)
  return () => destroyComputed(token)
}

export function autorun(fn) {
  const token = createComputed(fn, TYPE.TOKEN)
  return () => {
    destroyComputed(token)
  }
}
