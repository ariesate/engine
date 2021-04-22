/**
 * 返回一个可以把 leaf 变成类似于 ref 的 proxy。
 * 把 get/set/delete 都 delegate 到 parent 上。
 */
import { isReactiveLike, toRaw } from './index';
import {mapValues} from "../util";

const proxyCache = new WeakMap()
const fieldCache = new WeakMap()

/**
 * 这里的 proxyCache/fieldCache 不只是为了当前创建过程节约性能，
 * 同时也使得 axii 在处理 repaint 的时候能进行优化，因为它会进行引用的对比来决定要不要 repaint。fieldCache 能做到同引用。
 */
export default function delegateLeaf(parent) {
  const rawParent = toRaw(parent)
  const cache = proxyCache.get(rawParent)
  if (cache) return cache

  const proxy = new Proxy(parent, {
    // 每次 get 都创建新的 Proxy 没有关系，反正只是 delegate 到 parent 上
    get(target, key) {
      if (isReactiveLike(parent[key])) return parent[key]

      const fieldCaches = fieldCache.get(rawParent)
      if (fieldCaches[key] === undefined) {
        // 生一个 refLike 对象
        fieldCaches[key] = {
          _id: Math.random(),
          _isAtom: true,
          _isLeafRef: true,
          // 伪造 ref，需要提供这个 raw 来创造 draft，不要通过 value，因为读 value 在 ref 中是会被 track 的。
          get raw() {
            return parent[key]
          },
          get value() {
            return parent[key]
          },
          set value(nextValue) {
            parent[key] = nextValue
          }
        }
      }

      return fieldCaches[key]
    },
    set(target, key, value) {
      throw new Error(`cannot set ${key} to ${value}, because this is a leaf proxy. Use [leaf].value ot [parent].[leaf] to set`)
    },
  })

  proxyCache.set(rawParent, proxy)
  fieldCache.set(rawParent, {})
  return proxy
}

export function delegateLeaves(obj) {
  return mapValues(obj, (value, key) => delegateLeaf(obj)[key])
}