import {
  computed,
  isRef,
  reactive, ref,
  refComputed,
  toRaw,
} from './reactive'
import watch, { traverse } from './watch'
import deepClone from './cloneDeep'

const draftDisplayValue = new WeakMap()
const mutationTimeTable = new WeakMap()

export function isDraft(obj) {
  return mutationTimeTable.get(obj) !== undefined
}

export function getDisplayValue(draftValue) {
  return draftDisplayValue.get(draftValue)
}

export function draft(targetReactive) {
  const isRefComputed = isRef(targetReactive)
  // 用当前的值重新建立一个 reactive/ref 保持同步即可。如果是 computed 直接用 computation 执行一遍就可以了。
  // TODO 如果是复杂的 reactive 对象里面有非 plain object 怎么办？
  const draftValue = isRefComputed ? ref(targetReactive.value) : reactive(deepClone(toRaw(targetReactive), typeToCloneHandle))

  // 什么时候 destroy watchToken? 不需要手动销毁，因为外部的 computed 会被手动销毁，这时候会连带销毁依赖的 watchToken。
  watch(() => traverse(targetReactive), (isUnchanged) => {
    !isUnchanged && mutationTimeTable.set(targetReactive, Date.now())
  })

  watch(() => traverse(draftValue), (isUnchanged) => {
    !isUnchanged && mutationTimeTable.set(draftValue, Date.now())
  })
  // 设置个初始值
  mutationTimeTable.set(draftValue, Date.now())

  const computeMethod = isRefComputed ? refComputed : computed

  const displayValue = computeMethod(() => {
    traverse(draftValue)
    traverse(targetReactive)
    const draftMutationTime = mutationTimeTable.get(draftValue)
    const computedMutationTime = mutationTimeTable.get(targetReactive) || 0
    const target = (draftMutationTime > computedMutationTime) ? draftValue : targetReactive

    // CAUTION 这里为了性能并没有用 cloneDeep，而是直接包装了一下，因为是 computed，也不会被外部修改。
    return isRefComputed ? target.value : toRaw(target)
  })

  draftDisplayValue.set(draftValue, displayValue)

  return draftValue
}

// handle moment 等复杂类型
const typeToCloneHandle = new WeakMap()
draft.handle = function handleClass(Type, handleFn) {
  typeToCloneHandle.set(Type, handleFn)
}
