import {
  computed,
  isRef,
  reactive, ref,
  refComputed,
  toRaw,
  getComputation
} from './reactive'
import watch from './watch'
import deepClone from '@iusername/js-deep-clone'

const draftDisplayValue = new WeakMap()
const mutationTimeTable = new WeakMap()

export function isDraft(obj) {
  return mutationTimeTable.get(obj) !== undefined
}

export function getDisplayValue(draft) {
  return draftDisplayValue.get(draft)
}

export function draft(computedTarget) {
  const isRefComputed = isRef(computedTarget)
  // 用当前的值重新建立一个 reactive/ref 保持同步即可。如果是 computed 直接用 computation 执行一遍就可以了。
  // TODO 如果是复杂的 reactive 对象里面有非 plain object 怎么办？
  const draftValue = isRefComputed ? ref(computedTarget.value) : reactive(deepClone(toRaw(computedTarget)))

  // TODO 深度 watch 的问题
  // 什么时候 destroy watchToken? 不需要手动销毁，因为外部的 computed 会被手动销毁，这时候会连带销毁依赖的 watchToken。
  watch((watchAnyMutation) => watchAnyMutation(computedTarget), (isUnchanged) => {
    !isUnchanged && mutationTimeTable.set(computedTarget, Date.now())
  })

  watch((watchAnyMutation) => watchAnyMutation(draftValue), (isUnchanged) => {
    !isUnchanged && mutationTimeTable.set(draftValue, Date.now())
  })
  // 设置个初始值
  mutationTimeTable.set(draftValue, Date.now())

  const computeMethod = isRefComputed ? refComputed : computed

  const displayValue = computeMethod((watchAnyMutation) => {
    watchAnyMutation(draftValue)
    watchAnyMutation(computedTarget)
    const draftMutationTime = mutationTimeTable.get(draftValue)
    const computedMutationTime = mutationTimeTable.get(computedTarget) || 0
    const target = (draftMutationTime > computedMutationTime) ? draftValue : computedTarget

    // CAUTION 这里为了性能并没有用 cloneDeep，而是直接包装了一下，因为是 computed，也不会被外部修改。
    return isRefComputed ? target.value : toRaw(target)
  })

  draftDisplayValue.set(draftValue, displayValue)

  return draftValue
}

// TODO handle moment 等复杂类型
draft.handle = function handleClass(Type, cloneType) {

}

