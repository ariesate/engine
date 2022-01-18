import VNode from '@ariesate/are/VNode'
import { values, invariant } from './util'

export function createVnodePath(vnode, parentPath = [], index) {
  return parentPath.concat((vnode && vnode.key) ? vnode.key : `index@${index}`)
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
      walkRawVnodes(vnode, handler, currentPath, context)
    } else {
      const handlerReturn = handler(vnode, currentPath, vnodes, context)
      let nextContext = context
      let shouldStop = false
      if (Array.isArray(handlerReturn)) {
        shouldStop = handlerReturn[0]
        // CAUTION 注意这里 handle 可能返回 undefined，这时候不要覆盖
        if (handlerReturn[1]) nextContext = handlerReturn[1]
      }
      // CAUTION 这里应该重新用 index 读一下，因为 handler 可能替换了原来的 vnode，使得不可递归的现在可以了
      // if (vnode && !shouldStop && vnode.children !== undefined) {
      if (vnodes[index] && !shouldStop && vnodes[index].children !== undefined) {
        walkRawVnodes(vnodes[index].children, handler, currentPath, nextContext)
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

export function noop() {}
