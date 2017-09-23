import cloneDeep from 'lodash/clonedeep'
import { each, createUniqueIdGenerator } from './util'

export function isComponent(n) {
  return typeof n === 'object'
}

const createUniqueVnodeName = createUniqueIdGenerator('C')

// CAUTION 注意此函数有副作用，会给没有 displayName 的组件自动加上
export function getVnodeType(vnode) {
  if (vnode.type === null) return 'null'
  if (vnode.type === Array) return 'Array'
  if (vnode.type === String) return 'String'
  if (typeof vnode.type === 'string') return vnode.type

  if (typeof vnode.type === 'object') {
    if (vnode.type.displayName === undefined) {
      vnode.type.displayName = createUniqueVnodeName()
    }
    return vnode.type.displayName
  }
}

export function createVnodePath(vnode, parentPath = []) {
  return parentPath.concat(vnode.key)
}

export function walkVnodes(vnodes, handler, parentPath = []) {
  vnodes.forEach((vnode) => {
    const currentPath = createVnodePath(vnode, parentPath)
    handler(vnode, currentPath)

    if (vnode.children !== undefined) {
      walkVnodes(vnode.children, handler, currentPath)
    }
  })
}

export function walkCnodes() {

}

export function vnodePathToString(path) {
  return path.join('.')
}

function replaceVnode(ret, xpath, next) {
  const indexPath = xpath.split('.').map(p => p.split('-')[1])
  let pointer = { children: ret }
  for (let i = 0; i < indexPath.length - 1; i++) {
    pointer = pointer.children[indexPath[i]]
  }

  // 因为 next 也是数组，因此必须展开
  const replaceIndex = indexPath[indexPath.length - 1]
  pointer.children = pointer.children.slice(0, replaceIndex).concat(next).concat(pointer.children.slice(replaceIndex + 1))
}

export function ctreeToVtree(ctree) {
  if (ctree.ret === undefined) return

  const clonedRet = cloneDeep(ctree.ret)
  each(ctree.next, (cnode, xpath) => {
    replaceVnode(clonedRet, xpath, ctreeToVtree(cnode))
  })

  return clonedRet
}

export function noop() {}

export function cloneVnode(vnode) {
  const result = { ...vnode }
  if (vnode.children !== undefined) {
    result.children = []
  }

  return result
}


export function isComponentVnode(a) {
  return typeof a.type === 'object' && a.type !== Array
}

export function resolveFirstLayerElements(vnodes, parentPath, cnode) {
  return vnodes.reduce((result, vnode) => {
    if (vnode.type === null) {
      return result
    } else if (vnode.type === String || typeof vnode.type === 'string') {
      return [vnode.element]
    } else if (vnode.type === Array) {
      return vnode.children.reduce((elements, child) => {
        return elements.concat(resolveFirstLayerElements(child, createVnodePath(vnode, parentPath), cnode))
      }, [])
    } else if (typeof vnode.type === 'object') {
      const nextCnode = cnode.next[vnodePathToString(createVnodePath(vnode, parentPath))]
      return resolveFirstLayerElements(nextCnode.patch, [], nextCnode)
    }
    return result
  }, [])
}

export function makeVnodeKey(child, index) {
  const rawKey = (child.attributes && child.attributes.key !== undefined) ? child.attributes.key : `_${index}_`
  return `${getVnodeType(child)}-${rawKey}`
}
