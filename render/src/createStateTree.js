/**
 * stateTree 是配合 Render 一起使用的数据结构，它的核心功能有两个:
 * 1. 提供一个树状的数据保存功能。这个树状的数据理论上应该和 Render 渲染的组件数据结构保持一致。
 * 但是这个保障是需要由组件和正确的用户代码来保障的。不是由 stateTree 这个数据结构保障的。
 * 2. 提供深度 merge，自动修复，重置等数据功能。它在其中注册了组件渲染时的初始值(这个值里包含了
 * 用户设置的值)和组件的真实初始值，所以能提供重置功能。
 *
 * 组件和 state 的对应关系是通过 stateId 绑定的，statePath 只是第一次注册时用到了。
 *
 * 注意，pub 和 sub 的功能被提到了 applyStateTreeSubscriber 中，这样能保证 stateTree 实现尽量简单。
 * 阅读完 createStateTree 之后，建议阅读 applyStateTreeSubscriber。
 */
import cloneDeep from 'lodash/cloneDeep'
import exist from './exist'
import { PROD, DEBUG } from './constant'
import { ErrorWrongStateTreePath } from './errors'
import { joinPath } from './common'

import { each, partialRight, after, isObject, createUniqueIdGenerator } from './util'

/* eslint-disable no-use-before-define */
const ENV = (typeof ENV === 'undefined') ? PROD : ENV

export default function createStateTree(initialStateTree) {
  const stateTree = cloneDeep(initialStateTree) || {}
  const defaultStates = {}
  const initialStates = {}
  const createStateId = createUniqueIdGenerator('s')
  const stateIndexedById = {}
  let version = 0

  function guardWithPathDetect(fn) {
    return (statePath, ...rest) => {
      if (ENV === DEBUG && exist.detect(stateTree, statePath) !== true) {
        throw new ErrorWrongStateTreePath(statePath, exist.detect(stateTree, statePath))
      }

      return fn(statePath, ...rest)
    }
  }

  function get(statePath, defaultValue) {
    return exist.get(stateTree, statePath, defaultValue)
  }

  function complete(statePath, inputState) {
    // CAUTION，这里 exist.set 第四个参数 createMissing 非常重要
    if (exist.detect(stateTree, statePath) !== true) { return exist.set(stateTree, statePath, inputState, true) }
    if (typeof inputState === 'object') {
      each(inputState, (inputSubState, key) => complete(joinPath([statePath, key]), inputSubState))
    }
  }

  function defineState(state, id, pathGetters = {}) {
    Object.defineProperty(state, '_id', {
      value: id,
    })

    // CAUTION 目前 pathGetter 必须要有 getStatePath
    // 除此还有 getRootStatePath/getScopes/getRenderScopes
    each(pathGetters, (getter, name) => {
      Object.defineProperty(state, `_${name}`, {
        value: getter,
      })
    })

    // Object.defineProperty(state, '_getStatePath', {
    //   value: pathGetters.getStatePath,
    // })
    //
    // Object.defineProperty(state, '_getRootStatePath', {
    //   value: pathGetters.getRootStatePath,
    // })
    //
    // Object.defineProperty(state, '_getScopes', {
    //   value: pathGetters.getScopes,
    // })
  }

  function registerToStateTree(statePath, getInitialState, pathGetters) {
    complete(statePath, getInitialState())
    const stateId = createStateId()
    const state = get(statePath)
    defineState(state, stateId, pathGetters)
    stateIndexedById[stateId] = state
    return stateId
  }

  function findRelativePath(parent, child) {
    // CAUTION 未做检测。parent.length + 1 是为了去掉中间那个 . 号
    return child.slice(parent.length + 1)
  }

  function findParentPath(path) {
    const arr = path.split('.')
    arr.pop()
    return arr.join('.')
  }

  function findClosestInitialPath(statePath) {
    let result = statePath
    const arr = statePath.split('.')
    while (get(arr.join('.'), {})._id === undefined && arr.length !== 0) {
      arr.pop()
      result = arr.join('.')
    }
    // CAUTION 不要把 '' 也算成 initialStatePath, 这样不明确，容易出 bug
    return result !== '' ? result : undefined
  }

  function setNaive(stateNodePath, relativePath, value, inputStateId, inputStatePath) {
    const stateId = inputStateId || get(stateNodePath)._id
    exist.set(stateTree, joinPath([stateNodePath, relativePath]), value, true)
    return [{
      stateId,
      statePath: stateNodePath,
      valuePath: relativePath,
      inputStatePath,
    }]
  }

  function shapeObject(stateNodePath, relativePath, nextValue) {
    const origin = exist.get(stateTree, joinPath([stateNodePath, relativePath]))
    if (isObject(origin)) {
      Object.keys(origin).forEach((key) => {
        /* eslint-disable no-prototype-builtins*/
        if (!nextValue.hasOwnProperty(key)) delete origin[key]
        /* eslint-enable no-prototype-builtins*/
      })
    }
  }

  // CAUTION 递归 merge 规则，只对纯对象嵌套的有效，一旦中间夹有数组，就不再 merge了。
  function setObject(stateNodePath, relativePath, inputValue, inputStateId, mergeLastState, initialValue = {}, inputStatePath) {
    const stateId = inputStateId || get(stateNodePath)._id
    let changes = [{ stateId, statePath: stateNodePath, valuePath: relativePath }]
    const nextValue = mergeLastState ? inputValue : { ...initialValue, ...inputValue }
    // CAUTION 如果不是 mergeLastState， 那么一定要裁剪掉原本数据上多余的值!
    if (mergeLastState === false) {
      shapeObject(stateNodePath, relativePath, nextValue)
    }

    each(nextValue, (value, key) => {
      const childPath = joinPath([relativePath, key])
      if (typeof value !== 'object') {
        changes = changes.concat(setNaive(stateNodePath, childPath, value, stateId, inputStatePath))
      } else if (isObject(value) && !value._id) {
        // CAUTION 只对普通的对象继续深度递归，如果是 stateNode 说明可能是上级数组中的占位符，不再处理。
        changes = changes.concat(setObject(stateNodePath, childPath, value, stateId, mergeLastState, initialValue[key], inputStatePath))
      } else if (Array.isArray(value)) {
        changes = changes.concat(setArray(stateNodePath, childPath, value, stateId, mergeLastState, inputStatePath))
      }
    })

    return changes
  }

  function setArray(stateNodePath, relativePath, inputValue, inputStateId, mergeLastState, inputStatePath) {
    const stateId = inputStateId || get(stateNodePath)._id
    let changes = [{ stateId, statePath: stateNodePath, valuePath: relativePath }]
    // CAUTION 只要是数组操作，一定都是带了原来的引用的，所以直接设置进去肯定没问题
    exist.set(stateTree, joinPath([stateNodePath, relativePath]), inputValue)

    inputValue.forEach((value, key) => {
      const childPath = joinPath([relativePath, String(key)])
      if (typeof value !== 'object') {
        changes = changes.concat(setNaive(stateNodePath, childPath, value, stateId, inputStatePath))
      } else if (isObject(value)) {
        changes = changes.concat(setObject(stateNodePath, childPath, value, stateId, mergeLastState, {}, inputStatePath))
      } else {
        changes = changes.concat(setArray(stateNodePath, childPath, value, stateId, mergeLastState, inputStatePath))
      }
    })
    return changes
  }

  function setStateValue(statePath, key, value, stateId, inputStatePath, mergeLastState, initialState) {
    let changes = []
    if (typeof value !== 'object') {
      changes = changes.concat(setNaive(statePath, key, value, stateId, inputStatePath))
    } else if (isObject(value)) {
      const initialValue = initialState === undefined ? undefined : initialState[key]
      changes = changes.concat(setObject(statePath, key, value, stateId, mergeLastState, initialValue, inputStatePath))
    } else {
      changes = changes.concat(setArray(statePath, key, value, stateId, mergeLastState, inputStatePath))
    }
    return changes
  }


  function setStateNode(statePath, inputState, mergeLastState, inputStatePath) {
    let changes = []
    const stateId = get(statePath)._id
    const initialState = initialStates[stateId].getInitialState()
    const finalState = mergeLastState ? inputState : { ...initialState, ...inputState }
    each(finalState, (value, key) => {
      changes = changes.concat(setStateValue(statePath, key, value, stateId, inputStatePath, mergeLastState, initialState))
    })

    return changes
  }

  function patchChanges(stateNodePath, relativeChildPath, stateId, inputStatePath) {
    return relativeChildPath === '' ? [] : relativeChildPath.split('.').reduce((last, current) => {
      const nextPath = last.length > 0 ? `${last[last.length - 1].valuePath}.${current}` : current
      return last.concat({
        stateId,
        statePath: stateNodePath,
        valuePath: nextPath,
        inputStatePath,
      })
    }, [])
  }

  function setStateNodeFromDescendant(inputStatePath, inputState, mergeLastState) {
    const stateNodePath = findClosestInitialPath(inputStatePath)
    const stateId = get(stateNodePath)._id
    const initialState = initialStates[stateId].getInitialState()
    const relativeChildPath = findRelativePath(stateNodePath, inputStatePath)

    const parentPath = findParentPath(inputStatePath)
    const childPath = findRelativePath(parentPath, inputStatePath)
    const initialStateValue = exist.get(initialState, findParentPath(relativeChildPath), undefined)

    // CAUTION patchChange 第二个参数一定要 findParentPath, 因为后面的 setStateValue 也会记录最后一个 path
    return patchChanges(stateNodePath, findParentPath(relativeChildPath), stateId, inputStatePath)
      .concat(setStateValue(parentPath, childPath, inputState, stateId, inputStatePath, mergeLastState, initialStateValue))
  }

  function set(inputStatePath, inputState, mergeLastState = false) {
    return !get(inputStatePath, {})._id ?
      setStateNodeFromDescendant(inputStatePath, inputState, mergeLastState) :
      setStateNode(inputStatePath, inputState, mergeLastState, inputStatePath)
  }

  function defaults(type, getDefaultState) {
    defaultStates[type] = getDefaultState
  }

  function registerInitialState(initialStateId, getInitialState, type) {
    initialStates[initialStateId] = { getInitialState, type }
    return function cancelInitialState() {
      delete initialStates[initialStateId]
    }
  }

  // 回到节点的初始状态，而不是组件的初始状态
  // TODO 对于reset children 的支持, validation 这种 background 会用到
  function reset(statePath) {
    return set(statePath, initialStates[get(statePath)._id].getInitialState())
  }

  // 回到组件的初始状态
  // TODO 对于reset children 的支持, validation 这种 background 会用到
  function resetHard(statePath) {
    const defaultState = defaultStates[initialStates[get(statePath)._id].type]()
    return set(statePath, defaultState)
  }

  function increaseVersion() {
    version += 1
  }

  function getWithDetail(statePath) {
    const value = get(statePath)
    if (isObject(value) && value._id) return { value, stateId: value._id, statePath }

    const stateNodePath = findClosestInitialPath(statePath)
    return {
      value,
      stateId: get(stateNodePath)._id,
      statePath: stateNodePath,
      valuePath: findRelativePath(stateNodePath, statePath),
    }
  }

  function delegateToStatePathSetter(setter) {
    return function delegatedSetter(stateId, ...rest) {
      return setter(stateIndexedById[stateId]._getStatePath(), ...rest)
    }
  }

  return {
    get: guardWithPathDetect(get),
    getById: stateId => stateIndexedById[stateId],
    // CAUTION 这里暴露的 getWithDetail 是包含路径信息的，为了 bg 里面能读取依赖
    getWithDetail: guardWithPathDetect(getWithDetail),
    // 下面这四个是常用的 setter
    set: guardWithPathDetect(after(set, increaseVersion)),
    merge: guardWithPathDetect(after(partialRight(set, true), increaseVersion)),
    reset: guardWithPathDetect(after(reset, increaseVersion)),
    resetHard: guardWithPathDetect(after(resetHard, increaseVersion)),
    // 下面这四个是给 bg utilities 和 jobs 用的 setter
    setById: delegateToStatePathSetter(after(set, increaseVersion)),
    mergeById: delegateToStatePathSetter(after(partialRight(set, true), increaseVersion)),
    resetById: delegateToStatePathSetter(after(reset, increaseVersion)),
    resetHardById: delegateToStatePathSetter(after(resetHard, increaseVersion)),
    // 注册组件的原始值, 用于 resetHard
    defaults: guardWithPathDetect(defaults),
    // CAUTION register 对外暴露的接口会自动补全数据
    register: (statePath, getInitialState, type, pathGetters) => {
      const stateId = registerToStateTree(statePath, getInitialState, pathGetters)
      const cancelInitialState = registerInitialState(stateId, getInitialState, type)
      return {
        stateId,
        cancel() {
          cancelInitialState()
          const state = stateIndexedById[stateId]
          exist.remove(stateTree, state._getStatePath())
          delete stateIndexedById[stateId]
        },
      }
    },
    getTypeById: stateId => initialStates[stateId].type,
    getVersion: () => version,
  }
}
