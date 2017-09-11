import { createElement, setAttribute } from './dom'
import { each } from '../util'

function initialHandler(vnode) {
  const element = createElement(vnode)
  if (typeof vnode !== 'object') return element

  vnode.children().build((subVnode) => {
    element.appendChild(initialHandler(subVnode))
  })
  if (vnode.onVisit) {
    vnode.onVisit(element)
  }
  return element
}

function updateHandler(vnode, domRef, parentNode) {
  if (vnode === false) return

  const { changedAttributes } = vnode
  // 如果 changed === undefined 说明要完全重建
  if (changedAttributes === undefined) {
    const newElement = initialHandler(vnode)
    // 更新的时候 domRef 可能是没有的，因为是新增的节点
    if (domRef) {
      console.log(newElement, vnode)
      parentNode.insertBefore(newElement, domRef)
      parentNode.removeChild(domRef)
    } else {
      parentNode.appendChild(newElement)
    }
  } else {
    // 有 changed 说明是更新当前节点的 attributes, 这种情况下肯定有 domRef
    each(changedAttributes, (attribute, name) => {
      setAttribute(domRef, name, domRef)
    })

    vnode.children().build((childVnode, childIndex) => {
      const currentDom = domRef.childNodes[childIndex]
      updateHandler(childVnode, currentDom, domRef)
    })
  }
}

export default function createDOMRenderer(/* {invoke} */) {
  return {
    initialDigest(vnodesTraversor, rootRef) {
      vnodesTraversor.build((vnode) => {
        rootRef.appendChild(initialHandler(vnode))
      })
    },
    updateDigest(patchTraversor, domRefs) {
      const parentNode = domRefs[0].parentNode
      patchTraversor.build((vnode, index) => {
        updateHandler(vnode, domRefs[index], parentNode)
      })
    },
    batch() {

    },
  }
}
