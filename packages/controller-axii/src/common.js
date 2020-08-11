import VNode from '@ariesate/are/VNode'
import cloneDeep from 'lodash/clonedeep'
import { each, values, invariant } from './util'

export function createVnodePath(vnode, parentPath = [], index) {
  return parentPath.concat(vnode ? vnode.key : `index@${index}`)
}

export function walkVnodes(vnodes, handler, parentPath = []) {
  vnodes.forEach((vnode, index) => {
    invariant(vnode instanceof VNode, `detect not vnode item in walkVnodes, maybe you should use walkRawVnodes`)
    const currentPath = createVnodePath(vnode, parentPath, index)
    const shouldStop = handler(vnode, currentPath, vnodes)

    if (vnode && !shouldStop && vnode.children !== undefined) {
      walkVnodes(vnode.children, handler, currentPath)
    }
  })
}

export function walkRawVnodes(vnodes, handler, parentPath = [], context) {
  vnodes.forEach((vnode, index) => {
    const currentPath = createVnodePath(vnode, parentPath, index)
    if (Array.isArray(vnode)) {
      walkRawVnodes(vnode, handler, currentPath)
    } else {
      const shouldStop = handler(vnode, currentPath, vnodes)

      if (vnode && !shouldStop && vnode.children !== undefined) {
        walkRawVnodes(vnode.children, handler, currentPath)
      }
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

export function reverseWalkCnodes(cnodes, handler) {
  cnodes.forEach((cnode) => {
    reverseWalkCnodes(values(cnode.next || {}), handler)
    handler(cnode)
  })
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
