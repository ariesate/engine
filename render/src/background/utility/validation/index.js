import { each, ensure, mapValues, inject, some } from '../../../util'
import createStatePathCollector from '../../createStatePathCollector'
import { walkStateTree, joinPath, StatePath } from '../../../common'
import {
  VALIDATION_TYPE_NORMAL,
  VALIDATION_TYPE_SUCCESS,
  VALIDATION_TYPE_VALIDATING,
  REASON_VALIDATION_RESET,
  REASON_VALIDATION_CHANGE,
} from '../../../constant'
import createValidationCore from './createValidation'
import { escapeDot } from '../../common'
import createSubscribers from '../../../createSubscribers'

/* eslint-disable no-use-before-define */
export function initialize(stateTree, appearance, instances) {
  const listeners = createSubscribers()
  // 用来记录是否已经启动，启动后就要对动态 register 的组件进行反应了
  let started = false
  const core = createValidationCore(stateTree, appearance, handleCoreChange)
  const { selfValidationState, groupValidationState, groupIdToStateId } = core
  const collector = createStatePathCollector()
  function handleCoreChange({ self = [], group = [] }) {
    if (started !== true) return
    // 1. 直接修改 stateTree
    // 2. 通知所有 once 注册的依赖
    // assign new object to changeStateIds
    const changedStateIds = self.slice()
    // 先计算 self
    self.forEach((stateId) => {
      replaceStateTree(stateId, selfValidationState.get(stateId))
    })

    group.forEach((groupId) => {
      const result = groupValidationState.get(groupId)
      groupIdToStateId.get(groupId).forEach((stateId) => {
        ensure(changedStateIds, stateId)
        replaceStateTree(stateId, result)
      })
    })

    // CAUTION 在通知所有依赖
    listeners.notify(changedStateIds)
  }

  function replaceStateTree(stateId, result) {
    stateTree.mergeById(stateId, {
      status: result.type,
      help: result.help || '',
    }, {
      type: REASON_VALIDATION_CHANGE,
    })
  }

  function isValidRecursive(statePathToCheck, loose, includeInvisible) {
    let isCurrentValid = true
    walkStateTree(stateTree.get(statePathToCheck), statePathToCheck, (state) => {
      const result = isOneValid(state, loose, includeInvisible)
      if (result === false) isCurrentValid = false
      return result
    })
    return isCurrentValid
  }

  function isOneValid(state, loose, includeInvisible) {
    // CAUTION 这里的判断顺序很重要， 因为要先读 isVisibleById 才能注册依赖
    if ((!includeInvisible && !instances.appearance.isVisibleById(state._id)) || core.validators.get(state._id) === undefined) return true

    const type = state.status
    return loose ?
      (type === VALIDATION_TYPE_NORMAL || type === VALIDATION_TYPE_SUCCESS) :
      type === VALIDATION_TYPE_SUCCESS
  }

  // CAUTION isValid 查询是针对 statePath 来的
  function isValid(statePathToCheck, loose = false, includeInvisible = false) {
    collector.insert(statePathToCheck)

    const state = stateTree.get(statePathToCheck)
    if (state._id !== undefined) {
      return isOneValid(state, loose, includeInvisible)
    }
    return isValidRecursive(statePathToCheck, loose, includeInvisible)
  }

  // 劫持 listeners
  const injectListeners = (stateId, config, componentArg) => {
    const { validator } = config
    const { listeners: componentListeners = {} } = componentArg

    const listenerToInject = mapValues(validator, (_, name) => {
      return function injectedWithValidation(...args) {
        // CAUTION validation 只是捆绑执行一下，它并不改变原本 listener 的值
        const result = componentListeners[name] !== undefined ? componentListeners[name](...args) : undefined
        // CAUTION 这里要用传入参数的 statePath, 因为可能会变
        core.triggerValidator(stateId)
        return result
      }
    })

    return {
      ...componentArg,
      listeners: {
        ...componentArg.listeners,
        ...listenerToInject,
      },
    }
  }

  // 注入到 validator 里面数据
  const createInjectArg = (getStatePath, initializedInstances) => {
    return () => ({
      stateTree,
      statePath: new StatePath(getStatePath()),
      state: stateTree.get(getStatePath()),
      ...initializedInstances,
    })
  }

  function get(statePath) {
    return selfValidationState.get(stateTree.get(statePath)._id)
  }

  function isOneValidating(statePathToCheck) {
    // TODO 判断未显示的情况
    return stateTree.get(statePathToCheck).status === VALIDATION_TYPE_VALIDATING
  }

  function isValidatingRecursive() {

  }

  function isValidating(statePathToCheck, includeInvisible = false) {
    collector.insert(statePathToCheck)
    const state = stateTree.get(statePathToCheck)
    if (state._id !== undefined) {
      return isOneValidating(statePathToCheck, includeInvisible)
    }
    return isValidatingRecursive(statePathToCheck, includeInvisible)
  }

  function resetOne(stateId, changedStateIds) {
    if (core.validators.get(stateId) === undefined) return

    // TODO 还要清除 core 里的信息
    changedStateIds.push(stateId)
    stateTree.resetById(stateId, { type: REASON_VALIDATION_RESET })
  }

  function resetRecursive(statePathToReset, changedStateIds) {
    walkStateTree(stateTree.get(statePathToReset), statePathToReset, (state) => {
      resetOne(state._id, changedStateIds)
    })
  }

  function reset(statePathToReset) {
    const state = stateTree.get(statePathToReset)
    const changedStateIds = []
    if (state._id !== undefined) {
      resetOne(state._id, changedStateIds)
    } else {
      resetRecursive(statePathToReset, changedStateIds)
    }
    listeners.notify(changedStateIds)
  }

  return {
    ...core,
    start() { started = true },
    isValid,
    inject: {
      fn: injectListeners,
      last: true,
    },
    register(stateId, { validator: validatorDef }) {
      const state = stateTree.getById(stateId)
      const groupIds = []
      each(validatorDef, (validators) => {
        validators.map(({ fn, group }) => {
          const groupId = group !== undefined ? joinPath((state._getScopes() || []).map(({ statePath }) => statePath).concat(group)) : undefined
          if (groupId !== undefined) groupIds.push(groupId)
          return core.register(stateId, inject(fn, createInjectArg(state._getStatePath, instances)), groupId)
        })
      })
      return function cancelValidation() {
        core.cancel(stateId, groupIds)
      }
    },
    isValidating,
    get,
    reset,
    // 手动设置, 用于联合校验
    getErrors() {
    // getErrors(statePath, loose) {
      // const errorStatePath = []
      // oneOrAll(false, validationState, (currentStatePath) => {
      //   if (validationState.get(currentStatePath).type === VALIDATION_TYPE_ERROR) {
      //     errorStatePath.push(currentStatePath)
      //   }
      //   if (loose === true && validationState.get(currentStatePath).type === VALIDATION_TYPE_NORMAL) {
      //     errorStatePath.push(currentStatePath)
      //   }
      // }, statePath)
      // return errorStatePath
    },
    collect: collector.collect,
    extract: collector.extract,
    subscribe: (...arg) => listeners.insert(...arg),
  }
}

export function test(deps, changedStateIds, stateTree) {
  return changedStateIds.some((stateId) => {
    const changedStatePath = stateTree.getById(stateId)._getStatePath()
    return some(deps, (_, path) => {
      const exp = new RegExp(`^${escapeDot(path)}${path === '' ? '' : '\\.'}`)
      return (changedStatePath === path || exp.test(changedStatePath))
    })
  })
}

export function check({ validator }) {
  return validator !== undefined
}
