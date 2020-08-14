/**
 * 返回一个可以把 leaf 变成类似于 ref 的 proxy。
 * 把 get/set/delete 都 delegate 到 parent 上。
 */


export default function delegateLeaf(parent) {
  return new Proxy(parent, {
    // 每次 get 都创建新的 Proxy 没有关系，反正只是 delegate 到 parent 上
    get(target, key) {
      return {
        _isRef: true,
        _isLeafRef: true,
        get value() {
          return parent[key]
        },
        set value(nextValue) {
          parent[key] = nextValue
        }
      }
    },
    set(target, key, value) {
      throw new Error(`cannot set ${key} to ${value}, because this is a leaf proxy. Use [leaf].value ot [parent].[leaf] to set`)
    },
  })

}