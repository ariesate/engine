import {createComputed, isReactiveLike, isRef, destroyComputed} from './reactive';
import { TYPE } from './reactive/effect';



export default function watch(computation, callback) {
  let result
  let isFirstRun = true
  const token = createComputed((lastValue, watchAnyMutation) => {
    if (isFirstRun) {
      result = computation(watchAnyMutation)
      isFirstRun = false
    } else {
      computation(watchAnyMutation)
      callback()
    }
  }, TYPE.TOKEN)
  return [result, token]
}

export function traverse(obj) {
  if (!isReactiveLike(obj)) return

  if (isRef(obj)) return obj.value

  // 这个写法对数组和对象都支持
  for(let i in obj) {
    // CAUTION 不管 obj[i] 是什么，有了这个判断就算读了。
    if (obj.hasOwnProperty(i) && typeof obj[i] === 'object') {
      traverse(obj[i])
    }
  }
}

export function watchReactive(data, callback) {
  const [_, token] = watch(() => traverse(data), callback)
  return () => destroyComputed(token)
}
