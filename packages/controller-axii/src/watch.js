import { createComputed, isReactiveLike, isAtom, destroyComputed } from './reactive';
import { TYPE } from './reactive/effect';
import { deferred } from "./util";


export default function watch(computation, callback, runAtOnce) {
  let result
  let isFirstRun = true
  const token = createComputed((lastValue, watchAnyMutation) => {
    result = computation(watchAnyMutation)
    if (isFirstRun) {
      isFirstRun = false
    }

    if (!isFirstRun || runAtOnce) {
      // TODO callback 中发生的数据变化不应该影响当前的 computation ，使用 deferred ？
      //  deferred 会使时序变化。增加参数使当前 frame 不要 callback 中的依赖就行了？
      //  目前用 deferred 测试用例会有很多失败。
      // deferred(() => callback(result))
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
