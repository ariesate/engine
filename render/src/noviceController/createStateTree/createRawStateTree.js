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
import cloneDeep from 'lodash/clonedeep'
import OrderedMap from './OrderedMap'
import exist from './exist'
import { DEBUG } from '../constant'
import { ErrorWrongStateTreePath } from './errors'

import { each, partialRight, after, isObject } from '../../util'

function joinPath(statePath) {
  return statePath.reduce((last, current) => {
    return last.concat(current)
  }, []).join('.')
}

/* eslint-disable no-use-before-define */
// const ENV = (typeof ENV === 'undefined') ? PROD : ENV
// TODO
const ENV = DEBUG

export default function createStateTree(initialStateTree) {
  const stateTree = cloneDeep(initialStateTree) || {}
  // TODO 这两个 map 从来没有 remove 过
  const statePathMap = new Set()
  const stateInfo = {}
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
    if (exist.detect(stateTree, statePath.slice()) !== true) { return exist.set(stateTree, statePath.slice(), inputState, true) }
    if (typeof inputState === 'object') {
      each(inputState, (inputSubState, key) => complete(joinPath([statePath, key]), inputSubState))
    }
  }


  function registerToStateTree(statePath, getDefaultState = () => ({}), getInitialState = () => ({})) {
    const statePathStr = joinPath(statePath)
    complete(statePath, { ...getDefaultState(), ...getInitialState() })
    statePathMap.add(statePathStr)
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
    const arr = statePath.slice()
    while (!statePathMap.has(joinPath(statePath)) && arr.length !== 0) {
      arr.pop()
      result = arr.slice()
    }
    // CAUTION 不要把 '' 也算成 initialStatePath, 这样不明确，容易出 bug
    return result.length !== 0 ? result : undefined
  }

  function setNaive(stateNodePath, relativePath, value, inputStatePath) {
    exist.set(stateTree, joinPath([stateNodePath, relativePath]), value, true)
    return [{
      statePath: stateNodePath,
      valuePath: relativePath,
      inputStatePath,
    }]
  }

  function shapeObject(stateNodePath, relativePath, nextValue) {
    const origin = exist.get(stateTree, joinPath([stateNodePath, relativePath]))
    if (isObject(origin)) {
      Object.keys(origin).forEach((key) => {
        /* eslint-disable no-prototype-builtins */
        if (!nextValue.hasOwnProperty(key)) delete origin[key]
        /* eslint-enable no-prototype-builtins */
      })
    }
  }

  // CAUTION 递归 merge 规则，只对纯对象嵌套的有效，一旦中间夹有数组，就不再 merge了。
  // TODO 判断 object 是不是 scope !!!! 如果是的，必须要保持 OrderedMap 结构
  // 注意只有 statePath 下的集合形式的子路径才要求是 OrderedMap，如果只是一个普通数据，那就不用了。
  function setObject(stateNodePath, relativePath, inputValue, mergeLastState, initialValue = {}, inputStatePath) {
    let changes = [{ statePath: stateNodePath, valuePath: relativePath, inputStatePath }]
    const nextValue = mergeLastState ? inputValue : { ...initialValue, ...inputValue }
    // CAUTION 如果不是 mergeLastState， 那么一定要裁剪掉原本数据上多余的值!
    if (mergeLastState === false) {
      shapeObject(stateNodePath, relativePath, nextValue)
    }

    each(nextValue, (value, key) => {
      const childPath = joinPath([relativePath, key])
      if (typeof value !== 'object') {
        changes = changes.concat(setNaive(stateNodePath, childPath, value, inputStatePath))
      } else if (isObject(value) && !value._id) {
        // CAUTION 只对普通的对象继续深度递归，如果是 stateNode 说明可能是上级数组中的占位符，不再处理。
        changes = changes.concat(setObject(stateNodePath, childPath, value, mergeLastState, initialValue[key], inputStatePath))
      } else if (Array.isArray(value)) {
        changes = changes.concat(setArray(stateNodePath, childPath, value, mergeLastState, inputStatePath))
      }
    })

    return changes
  }

  function setArray(stateNodePath, relativePath, inputValue, mergeLastState, inputStatePath) {
    let changes = [{ statePath: stateNodePath, valuePath: relativePath, inputStatePath }]
    // CAUTION 只要是数组操作，一定都是带了原来的引用的，所以直接设置进去肯定没问题
    exist.set(stateTree, joinPath([stateNodePath, relativePath]), inputValue)

    inputValue.forEach((value, key) => {
      const childPath = joinPath([relativePath, String(key)])
      if (typeof value !== 'object') {
        changes = changes.concat(setNaive(stateNodePath, childPath, value, inputStatePath))
      } else if (isObject(value)) {
        changes = changes.concat(setObject(stateNodePath, childPath, value, mergeLastState, {}, inputStatePath))
      } else {
        changes = changes.concat(setArray(stateNodePath, childPath, value, mergeLastState, inputStatePath))
      }
    })
    return changes
  }

  function setStateValue(statePath, key, value, inputStatePath, mergeLastState, initialState) {
    let changes = []
    if (typeof value !== 'object') {
      changes = changes.concat(setNaive(statePath, key, value, inputStatePath))
    } else if (isObject(value)) {
      const initialValue = initialState === undefined ? undefined : initialState[key]
      changes = changes.concat(setObject(statePath, key, value, mergeLastState, initialValue, inputStatePath))
    } else {
      changes = changes.concat(setArray(statePath, key, value, mergeLastState, inputStatePath))
    }
    return changes
  }


  function setStateNode(statePath, inputState, mergeLastState, inputStatePath) {
    let changes = []
    const initialState = stateInfo[joinPath(statePath)].getInitialState()
    const finalState = mergeLastState ? inputState : { ...initialState, ...inputState }
    each(finalState, (value, key) => {
      changes = changes.concat(setStateValue(statePath, key, value, inputStatePath, mergeLastState, initialState))
    })

    return changes
  }

  function patchChanges(stateNodePath, relativeChildPath, inputStatePath) {
    return relativeChildPath === '' ? [] : relativeChildPath.split('.').reduce((last, current) => {
      const nextPath = last.length > 0 ? `${last[last.length - 1].valuePath}.${current}` : current
      return last.concat({
        statePath: stateNodePath,
        valuePath: nextPath,
        inputStatePath,
      })
    }, [])
  }

  function setStateNodeFromDescendant(inputStatePath, inputState, mergeLastState) {
    const stateNodePath = findClosestInitialPath(inputStatePath)
    const initialState = stateInfo[joinPath(inputStatePath)].getInitialState()
    const relativeChildPath = findRelativePath(stateNodePath, inputStatePath)

    const parentPath = findParentPath(inputStatePath)
    const childPath = findRelativePath(parentPath, inputStatePath)
    const initialStateValue = exist.get(initialState, findParentPath(relativeChildPath), undefined)

    // CAUTION patchChange 第二个参数一定要 findParentPath, 因为后面的 setStateValue 也会记录最后一个 path
    return patchChanges(stateNodePath, findParentPath(relativeChildPath), inputStatePath)
      .concat(setStateValue(parentPath, childPath, inputState, inputStatePath, mergeLastState, initialStateValue))
  }

  function set(inputStatePathStr, inputState, mergeLastState = false) {
    const inputStatePath = inputStatePathStr.split('.')

    return statePathMap.has(inputStatePathStr) ?
      setStateNode(inputStatePath, inputState, mergeLastState, inputStatePath) :
      setStateNodeFromDescendant(inputStatePath, inputState, mergeLastState)
  }


  // 回到节点的初始状态，而不是组件的初始状态
  // TODO 对于reset children 的支持, validation 这种 background 会用到
  function reset(statePath) {
    return set(statePath, stateInfo[joinPath(statePath)].getInitialState())
  }

  // 回到组件的初始状态
  // TODO 对于reset children 的支持, validation 这种 background 会用到
  function resetHard(statePath) {
    const defaultState = stateInfo[joinPath(statePath)].type.getDefaultState()
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

  return {
    get: guardWithPathDetect(get),
    // CAUTION 这里暴露的 getWithDetail 是包含路径信息的，为了 bg 里面能读取依赖
    getWithDetail: guardWithPathDetect(getWithDetail),
    // 下面这四个是常用的 setter
    set: guardWithPathDetect(after(set, increaseVersion)),
    merge: guardWithPathDetect(after(partialRight(set, true), increaseVersion)),
    reset: guardWithPathDetect(after(reset, increaseVersion)),
    resetHard: guardWithPathDetect(after(resetHard, increaseVersion)),
    // CAUTION register 对外暴露的接口会自动补全数据
    register: (statePath, type, getInitialState = () => ({})) => {
      // TODO 拆分 type
      // TODO setObject 的时候判断是不是 scope!!!

      registerToStateTree(statePath, type.getDefaultState, getInitialState)
      stateInfo[joinPath(statePath)] = { getInitialState, type }
    },
    unregister(statePath) {
      statePathMap.remove(joinPath(statePath))
    },
    toJS() {

    },
    getVersion: () => version,
  }
}
