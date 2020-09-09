import { toRaw, isRef } from './reactive';
import { applyPatches, produce } from './produce';

// 这个优化是对同一个数据的多次操作，和 debounceComputed 不同。主要针对的场景是同样的值可能被多次设置，并且顺序是没有关系，只要终值就行。
// debounceComputed 在 effect 里把会触发的 computed 都合并一下，主要处理多个 reactive 触发同一个 computed 的问题。
export default function batchOperation(reactiveSource, operation) {
  const source = isRef(reactiveSource) ? {value : reactiveSource.value} : toRaw(reactiveSource)

  let changes = []
  produce(
      source,
      draft => operation(draft),
      (patches) => changes.push(...patches)
  )

  applyPatches(reactiveSource, changes)
}