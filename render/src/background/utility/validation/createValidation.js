import { ensure, createUniqueIdGenerator } from '../../../util'
import { isPromiseLike, walkStateTree } from '../../../common'
import { createOneToManyContainer, createValidatingPromiseContainer, createValidationState, pickResult } from './util'
import { VALIDATION_TYPE_NORMAL, VALIDATION_TYPE_VALIDATING } from '../../../constant'

const createSessionId = createUniqueIdGenerator('v')

export default function createValidationCore(stateTree, appearance, handleResult) {
  // 记录所有 validator, 以 stateId 为索引
  const validators = createOneToManyContainer()
  // 记录所有自校验结果， 以 stateId 为索引
  const selfValidationState = createValidationState()
  const groupValidationState = createValidationState()
  // 记录所有联合校验结果， 以 stateId 为索引
  const groupIdToStateId = createOneToManyContainer()

  // 用来记录异步验证状态
  const selfValidatingPromises = createValidatingPromiseContainer()
  const combinedValidatingPromises = createValidatingPromiseContainer()

  function register(stateId, validator, groupId) {
    validators.insert(stateId, { validator, groupId })
    if (groupId === undefined) {
      selfValidationState.set(stateId, { type: VALIDATION_TYPE_NORMAL })
      // 在注册的时候就要通知外部变化，例如 repeat 动态添加新的表单组件
      handleResult({ self: [stateId] })
    } else {
      groupIdToStateId.insert(groupId, stateId)
      groupValidationState.replace(groupId, { type: VALIDATION_TYPE_NORMAL })
      // 在注册的时候就要通知外部变化，例如 repeat 动态添加新的表单组件
      handleResult({ group: [groupId] })
    }
  }

  function executeValidator(stateId, sessionId, changedIds, asyncStateIds, asyncGroupIds, triggeredGroupValidatorCache = {}) {
    const validatorsToTrigger = validators.get(stateId)
    if (validatorsToTrigger === undefined) return

    validatorsToTrigger.forEach(({ validator, groupId }) => {
      // 这里操作有两步，一是触发所有校验器，二是收集校验结果
      const isSelf = groupId === undefined
      const id = isSelf ? stateId : groupId
      // 结果存到哪
      const resultHolder = isSelf ? selfValidationState : groupValidationState


      // 异步的 promise存到哪
      const asyncHolder = isSelf ? selfValidatingPromises : combinedValidatingPromises
      // 用来通知外部有哪些变化
      const changeHolder = isSelf ? changedIds.self : changedIds.group
      // 用来保存产生了 promise 的 id, 之后一起注册回调
      const cacheHolder = isSelf ? asyncStateIds : asyncGroupIds

      // 开始前先把上一次 validate 的数据清空。
      resultHolder.reset(id, sessionId)
      // CAUTION 不管是同步还是异步，不管是联合还是自校验，只要到顶了就不用再算了
      if (resultHolder.isTop(id)) return
      // CAUTION 因为联合校验器会绑在多个组件上，所以这里减少一下重复的触发
      if (!isSelf && triggeredGroupValidatorCache[groupId] === true) return


      const result = validator()
      if (!isPromiseLike(result)) {
        // 如果是同步结果
        resultHolder.replace(id, result)
        ensure(changeHolder, id)
      } else {
        // 如果是异步的，先标记为 VALIDATING
        resultHolder.replace(id, { type: VALIDATION_TYPE_VALIDATING, help: '' })
        ensure(changeHolder, id)

        // 再往 promise 管理器中设值
        if (!asyncHolder.isInitialized(id)) {
          asyncHolder.initialize(id)
        }
        asyncHolder.insert(id, result)

        // 在 cache 中存一下，来提高 group validation 的性能
        ensure(cacheHolder, id)
      }
    })
  }

  function callHandleResult(changedIds, asyncStateIds, asyncGroupIds) {
    // 全都触发了，先把这次验证产生的同步状态变化处理掉。
    handleResult(changedIds)

    // 再注册所有异步任务的回调
    asyncStateIds.forEach((asyncStateId) => {
      if (selfValidationState.isTop(asyncStateId)) {
        selfValidatingPromises.remove(asyncStateId)
      } else {
        selfValidatingPromises.createFinal(asyncStateId, (results) => {
          selfValidationState.set(asyncStateId, pickResult(results))
          handleResult({ self: [asyncStateId] })
        })
      }
    })

    asyncGroupIds.forEach((asyncGroupId) => {
      if (groupValidationState.isTop(asyncGroupId)) {
        combinedValidatingPromises.remove(asyncGroupId)
      } else {
        combinedValidatingPromises.createFinal(asyncGroupId, (results) => {
          groupValidationState.set(asyncGroupId, pickResult(results))
          handleResult({ group: [asyncGroupId] })
        })
      }
    })
  }

  function triggerValidator(stateId, sessionId = createSessionId()) {
    const asyncStateIds = []
    const asyncGroupIds = []
    const changedIds = { self: [], group: [] }
    executeValidator(stateId, sessionId, changedIds, asyncStateIds, asyncGroupIds)
    callHandleResult(changedIds, asyncStateIds, asyncGroupIds)
  }

  function triggerValidatorRecursive(statePathToValidate, sessionId = createSessionId()) {
    const asyncStateIds = []
    const asyncGroupIds = []
    const changedIds = { self: [], group: [] }

    // 缓存一下联合校验器的触发，改善性能
    const triggeredGroupValidatorCache = {}
    walkStateTree(stateTree.get(statePathToValidate), statePathToValidate, (state) => {
      executeValidator(state._id, sessionId, changedIds, asyncStateIds, asyncGroupIds, triggeredGroupValidatorCache)
    })

    callHandleResult(changedIds, asyncStateIds, asyncGroupIds)
  }

  function validate(statePathToValidate = '', ...rest) {
    const sessionId = createSessionId()
    const state = stateTree.get(statePathToValidate)
    if (state._id !== undefined) {
      return triggerValidator(state._id, sessionId, ...rest)
    }
    return triggerValidatorRecursive(statePathToValidate, sessionId, ...rest)
  }

  function cancel(stateId, groupIds) {
    selfValidationState.remove(stateId)
    groupIds.forEach((groupId) => {
      groupIdToStateId.remove(groupId, stateId)
      if (groupIdToStateId.get(groupId) === undefined) groupValidationState.remove(groupId)
    })
    validators.removeAll(stateId)
  }

  return {
    selfValidationState,
    groupValidationState,
    groupIdToStateId,
    validators,
    register,
    cancel,
    validate,
    triggerValidator,
    // reset: partial(oneOrAll, false, validators, (statePath) => {
    // }),
  }
}
