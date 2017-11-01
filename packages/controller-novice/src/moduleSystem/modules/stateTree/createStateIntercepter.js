import { intercept, isObservableArray } from 'mobx'
import exist from '../../exist'
import { mapValues } from '../../../util'

function splitPath(path) {
  return [path.slice(0, path.length - 1), path[path.length - 1]]
}

function createLeafTrackTree() {
  const tree = {}
  function dispose(path) {
    if (path.length === 0) return
    const [targetPath, propPath] = splitPath(path)
    const target = exist.get(targetPath)
    delete target[propPath]
    if (Object.keys(target).length === 0) dispose(targetPath)
  }

  return {
    track(path) {
      exist.set(tree, path, path, true)
    },
    isTracked(path) {
      return exist.get(tree, path) !== undefined
    },
    getLeaf(path) {
      const target = exist.get(tree, path)
      // not tracked
      if (target === undefined) return undefined
      // path is not a leaf
      if (!Array.isArray(target)) return false
      return target
    },
    dispose,
  }
}

export default function createStateIntercepter(cnode) {
  const attachedChildCnodes = new Map()
  const trackedIntercepters = createLeafTrackTree()
  let intercepting = false


  function recursiveReplaceWithChildStateChange(newValue, path) {
    // CAUTION only the same reference of path can retrieve the childCnode
    const childBind = trackedIntercepters.getLeaf(path)
    // not tracked
    if (childBind === undefined) return newValue
    // is not a leaf
    if (childBind === false) {
      const handler = (subValue, subKey) => {
        return (typeof subValue === 'object' && subValue !== null) ?
          recursiveReplaceWithChildStateChange(subValue, path.concat(subKey)) :
          subValue
      }
      return (Array.isArray(newValue) || isObservableArray(newValue)) ?
        newValue.map(handler) :
        mapValues(newValue, handler)
    }

    // TODO 先就这样，之后要处理 destroy 了，但没有 dispose 的情况
    if (!attachedChildCnodes.get(path)) {
      return newValue
    }
    // it is a leaf
    const childState = attachedChildCnodes.get(childBind).state
    // should trigger child cnode collect!
    if (childState !== newValue) {
      Object.assign(childState, newValue)
    }
    return childState
  }

  function interceptArray(target, index, path) {
    const dispose = intercept(target, (change) => {
      if (intercepting) return change
      if (change.type !== 'update' || change.index !== index) return change
      intercepting = true
      change.newValue = recursiveReplaceWithChildStateChange(change.newValue, path)
      intercepting = false
      dispose()
      return change
    })
  }

  function interceptObject(target, propName, path) {
    const dispose = intercept(target, propName, (change) => {
      if (intercepting) return change
      intercepting = true
      change.newValue = recursiveReplaceWithChildStateChange(change.newValue, path)
      intercepting = false
      dispose()
      return change
    })
  }

  function interceptOne(path) {
    const [targetPath, propName] = splitPath(path)
    const target = exist.get(cnode.state, targetPath)
    if (isObservableArray(target)) {
      interceptArray(target, propName, path)
    } else {
      interceptObject(target, propName, path)
    }
  }

  return {
    interceptOnce(childBind, childCnode) {
      if (!attachedChildCnodes.get(childBind)) attachedChildCnodes.set(childBind, childCnode)
      const length = childBind.length
      childBind.some((_, index) => {
        const path = childBind.slice(0, length - index)
        if (trackedIntercepters.isTracked(path)) return true
        interceptOne(path)
        return false
      })
      // CAUTION Trick here! We track childBind alone, because attachedChildCnodes is a Map, using reference as index.
      // If we want get the value from it, we must pass the same reference in as key.
      trackedIntercepters.track(childBind)
    },
    dispose(childBind) {
      attachedChildCnodes.delete(childBind)
      // CAUTION Not really dispose the intercepter, just intercepter won't intercept because info lost.
      trackedIntercepters.dispose(childBind)
    },
  }
}
