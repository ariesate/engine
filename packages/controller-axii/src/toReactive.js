import { isReactiveLike, destroyComputed, toRaw, isRef } from './reactive';
import { getFromMap } from './util';
import watch from './watch';

const objToReactiveMap = new WeakMap()
const objToWatchTokens = new WeakMap()

function getPureRaw(obj) {
  return isRef(obj) ? toRaw(obj).value : toRaw(obj)
}

/**
 * 用来给一下副作用对象使用，例如 title 等。
 */
export default function toReactive(obj) {
  if (objToReactiveMap.get(obj)) return objToReactiveMap.get(obj)

  const proxy = new Proxy(obj, {
    set(target, key, value) {
      const tokensByKey = getFromMap(objToWatchTokens, target, () => ({}))
      if (tokensByKey[key]) {
        destroyComputed(tokensByKey[key])
        delete tokensByKey[key]
      }

        // 非reactive 形式，直接赋值
      if (!isReactiveLike(value)) {
        target[key] = value
      } else {
        const [result, watchToken] = watch((watchAnyMutation) => {
          watchAnyMutation(value)
        }, () => {
          target[key] = getPureRaw(value)
        })
        // save token
        tokensByKey[key] = watchToken
        target[key] = getPureRaw(value)
      }

      return true
    }
  })

  objToReactiveMap.set(obj, proxy)
  return proxy
}