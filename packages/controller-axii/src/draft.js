import {
  arrayComputed,
  isRef,
  objectComputed,
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

export function draft(computed) {
  const isRefComputed = isRef(computed)
  // 用当前的值重新建立一个 reactive/ref 保持同步即可。如果是 computed 直接用 computation 执行一遍就可以了。
  // TODO 如果是复杂的 reactive 对象里面有非 plain object 怎么办？
  const draftValue = isRefComputed ? ref(computed.value) : reactive(deepClone(toRaw(computed)))

  // TODO 深度 watch 的问题
  // 什么时候 destroy watchToken? 不需要手动销毁，因为外部的 computed 会被手动销毁，这时候会连带销毁依赖的 watchToken。
  watch((watchAnyMutation) => watchAnyMutation(computed), (isUnchanged) => {
    !isUnchanged && mutationTimeTable.set(computed, Date.now())
  })

  watch((watchAnyMutation) => watchAnyMutation(draftValue), (isUnchanged) => {
    !isUnchanged && mutationTimeTable.set(draftValue, Date.now())
  })
  // 设置个初始值
  mutationTimeTable.set(draftValue, Date.now())

  const computeMethod = isRefComputed ? refComputed : (Array.isArray(computed) ? arrayComputed : objectComputed)

  const displayValue = computeMethod((watchAnyMutation) => {
    watchAnyMutation(draftValue)
    watchAnyMutation(computed)
    const draftMutationTime = mutationTimeTable.get(draftValue)
    const computedMutationTime = mutationTimeTable.get(computed) || 0
    const target = (draftMutationTime > computedMutationTime) ? draftValue : computed

    // CAUTION 这里为了性能并没有用 cloneDeep，而是直接包装了一下，因为是 computed，也不会被外部修改。
    return isRefComputed ? target.value : toRaw(target)
  })

  draftDisplayValue.set(draftValue, displayValue)

  return draftValue
}

// TODO handle moment 等复杂类型
draft.handle = function handleClass(Type, cloneType) {

}

