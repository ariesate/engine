import cloneDeep from 'lodash/clonedeep'
import {partialRight, each} from './util'


function isComponentType(v) {
  return typeof v === 'object' && typeof v.name === 'object' && typeof v.name.render === 'function'
}


function replaceVnode(ret, xpath, next) {
  const indexPath = xpath.split('.').map(p => p.split('-')[1] )
  let pointer = { children: ret }
  for(let i = 0; i < indexPath.length - 1; i ++) {
    pointer = pointer.children[indexPath[i]]
  }

  // 因为 next 也是数组，因此必须展开
  const replaceIndex = indexPath[indexPath.length-1]
  pointer.children = pointer.children.slice(0, replaceIndex).concat(next).concat(pointer.children.slice(replaceIndex+1))
}

export function ctreeToVtree(ctree) {
  if( ctree.ret === undefined) return

  const clonedRet = cloneDeep(ctree.ret)
  each(ctree.next, (cnode, xpath) => {
    replaceVnode(clonedRet, xpath, ctreeToVtree(cnode))
  })

  return clonedRet
}

export function vtreeToHTML(vnodes, indent = 0) {

  return vnodes.map(vnode => {
    if( typeof vnode !== 'object' ) return `${' '.repeat(indent)}${vnode}`

    return `${' '.repeat(indent)}<${vnode.name} ${vnode.attributes ? JSON.stringify(vnode.attributes) : ''}>
${vnode.children ? vtreeToHTML(vnode.children, indent+2) : ''}
${' '.repeat(indent)}</${vnode.name}>`

  }).join('\n')
}