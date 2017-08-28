/* eslint-disable no-useless-escape*/
import { reduce, keys } from './util'

const PATH_ID = /[\[\]\.]+/

function recursiveGetBranches(obj, parent = [], isChild) {
  if (typeof obj === 'object' && keys(obj.children).length !== 0) {
    const reducer = (last, sub, key) => {
      return sub !== undefined ? last.concat(recursiveGetBranches(sub, parent.concat(key), true)) : last
    }
    return reduce(obj.children, reducer, [])
  }
  // 如果是 root 直接走到这一步, 说明没有任何子节点
  return isChild ? parent.join('.') : []
}

function isRootPath(path) {
  return path === undefined || path === ''
}

function parentPath(path) {
  return path.split('.').slice(0, path.length - 1).join('.')
}

function getNode(tree, stringPath = '') {
  if (stringPath.trim() === '') return tree
  const path = stringPath.split(PATH_ID)
  let current = tree
  let currentKey = path.shift()
  while (currentKey !== undefined && current !== undefined) {
    current = current.children[currentKey]
    currentKey = path.shift()
  }
  return current
}

export default function createTree() {
  const tree = {
    value: null,
    children: {},
  }

  function get(stringPath = '', defaultValue) {
    const node = stringPath === '' ? tree : getNode(tree, stringPath)
    return node === undefined ? defaultValue : node.value
  }

  function set(stringPath = '', value) {
    if (stringPath === '') {
      tree.value = value
      return true
    }

    const path = stringPath.split(PATH_ID)
    const ownee = path.pop()
    const last = getNode(tree, path.join('.'))
    if (last === undefined) return false

    last.children[ownee] = { value, children: {} }
    return true
  }

  function forceSet(stringPath, value) {
    if (stringPath === '') {
      tree.value = value
      return true
    }

    const path = stringPath.split(PATH_ID)
    let current = tree
    let currentKey = path.shift()
    while (currentKey !== undefined) {
      if (current.children[currentKey] === undefined) {
        current.children[currentKey] = { value: null, children: {} }
      }
      current = current.children[currentKey]
      currentKey = path.shift()
    }
    current.value = value

    return true
  }

  function remove(statePath) {
    const parent = get(parentPath(statePath))
    delete parent.children[statePath.split('.').pop()]
  }

  return {
    get,
    set,
    forceSet,
    remove,
    getTree() {
      return tree
    },
    getBranches(path = '') {
      const node = getNode(tree, path)
      return recursiveGetBranches(node)
    },
  }
}

export function oneOrAll(usedAsEvery, tree, fn, statePath, ...restArg) {
  const arrayMethod = usedAsEvery ? 'every' : 'forEach'
  if (tree.get(statePath) === null) {
    // value 为 null 说明这个字段只是一个标识符，所以玩下递归执行所有的
    return tree.getBranches(statePath)[arrayMethod]((relativeStatePath) => {
      const finalPath = isRootPath(statePath) ? relativeStatePath : `${statePath}.${relativeStatePath}`
      return fn(finalPath, ...restArg)
    })
  }
  return fn(statePath, ...restArg)
}
