import cloneDeep from 'lodash/clonedeep'
import { each, createUniqueIdGenerator, isObject, isFunction, values } from './util'
import Fragment from './Fragment'

export function isComponent(n) {
  return typeof n !== 'string' && n !== null && n !== String && n !== Array && n!== Fragment
}

const createUniqueVnodeName = createUniqueIdGenerator('Com')

// CAUTION Side effects here. DisplayName will be generated if it is undefined.
export function getVnodeType(vnode) {
  if (vnode.type === null) return 'null'
  if (vnode.type === Array) return 'Array'
  if (vnode.type === String) return 'String'
  if (vnode.type === Fragment) return 'Fragment'
  if (typeof vnode.type === 'string') return vnode.type

  if (typeof vnode.type === 'object' || typeof vnode.type === 'function') {
    if (vnode.type.displayName === undefined) {
      vnode.type.displayName = (vnode.type.name && /[A-Z]/.test(vnode.type.name[0])) ? vnode.type.name : createUniqueVnodeName()
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
    const shouldStop = handler(vnode, currentPath)

    if (!shouldStop && vnode.children !== undefined) {
      walkVnodes(vnode.children, handler, currentPath)
    }
  })
}

export function walkRawVnodes(vnodes, handler, parentPath = [], context) {
  vnodes.forEach((vnode, index) => {
    const currentPath = parentPath.concat(index)
    const nextContext = handler(vnode, currentPath, context)

    if (nextContext !== false && vnode.children !== undefined) {
      walkRawVnodes(vnode.children, handler, currentPath, nextContext)
    }
  })
}

export function walkCnodes(cnodes, handler) {
  cnodes.forEach((cnode) => {
    const shouldStop = handler(cnode) === false
    if (!shouldStop) {
      walkCnodes(values(cnode.next || {}), handler)
    }
  })
}

export function vnodePathToString(path) {
  return path.join('|')
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
  return isComponent(a.type)
}

export function getVnodeNextIndex(vnode, parentPath) {
  return vnode.transferKey === undefined ? vnodePathToString(createVnodePath(vnode, parentPath)) : vnode.transferKey
}

export function resolveFirstLayerElements(vnodes, parentPath, cnode) {
  return vnodes.reduce((result, vnode) => {
    if (vnode.type === null) {
      return result
    } else if (vnode.type === String || typeof vnode.type === 'string') {
      return [vnode.element]
    } else if (vnode.type === Array || vnode.type === Fragment) {
      return vnode.children.reduce((elements, child) => {
        return elements.concat(resolveFirstLayerElements([child], createVnodePath(vnode, parentPath), cnode))
      }, [])
    } else {
      // CAUTION 剩余的类型，全部认为是组件
      const nextPath = getVnodeNextIndex(vnode, parentPath)
      const nextCnode = cnode.next[nextPath]
      if (!nextCnode) throw new Error(`unknown vnode with path ${nextPath}`)
      return resolveFirstLayerElements(nextCnode.patch, [], nextCnode)
    }
    return result
  }, [])
}

export function makeVnodeKey(vnode, index) {
  const rawKey = vnode.rawKey !== undefined ? vnode.rawKey : `[${index}]`
  return `<${getVnodeType(vnode)}>${rawKey}`
}

export function makeVnodeTransferKey(vnode) {
  return vnode.rawTransferKey === undefined ? undefined : `${getVnodeType(vnode)}@${vnode.rawTransferKey}`
}

export function createResolveElement(first) {
  return function resolveFirstOrLastElement(vnode, parentPath, cnode, isComponentVnode) {
    let result = null
    if (vnode.type === String || typeof vnode.type === 'string') {
      result = vnode.element
    } else if (vnode.type === Array || vnode.type === Fragment) {
      const children = first ? vnode.children.slice() : vnode.children.slice().reverse()
      children.some((child) => {
        result = resolveFirstOrLastElement(child, createVnodePath(vnode, parentPath), cnode, isComponentVnode)
        return Boolean(result)
      })
    } else if (isComponentVnode(vnode)){
      const nextIndex = getVnodeNextIndex(vnode, parentPath)
      const nextCnode = cnode.next[nextIndex]
      if (!nextCnode) {
        throw new Error(`unknown vnode type ${nextIndex}`)
      }
      const nextVnodes = nextCnode.patch || nextCnode.ret
      if (nextVnodes.length > 0) {
        result = resolveFirstOrLastElement(nextVnodes[nextVnodes.length - 1], [], nextCnode, isComponentVnode)
      }
    }
    // type: null 的情况
    return result
  }
}

export const resolveFirstElement = createResolveElement(true)
export const resolveLastElement = createResolveElement(false)
