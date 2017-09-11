import cloneDeep from 'lodash/clonedeep'
import { each } from './util'

export function isComponent(n) {
  return typeof n === 'object'
}

export function getVnodeName(vnode) {
  return (typeof vnode.name === 'string') ?
    vnode.name :
    (typeof vnode === 'object') ?
      vnode.name.displayName :
      'text'
}

export function createVnodePath(vnode, index, parentPath = []) {
  return parentPath.concat({ name: getVnodeName(vnode), index })
}

export function walkVnodes(vnodes, handler, parentPath = []) {
  vnodes.forEach((vnode, index) => {
    const currentPath = createVnodePath(vnode, index, parentPath)
    handler(vnode, currentPath)

    if (vnode.children !== undefined) {
      walkVnodes(vnode.children, handler, currentPath)
    }
  })
}

export function walkCnodes() {
}

export function vnodePathToString(path) {
  return path.map(p => `${p.name}-${p.index}`).join('.')
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

// 下面是 patch 所需要的
export function isComponentNode(node) {
  return typeof node.name === 'object'
}
