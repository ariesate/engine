import { createElement } from './dom'

function updateHandler(vnode, index, domRef, parent) {
  if (vnode === false) return

  const { shouldReuse } = vnode
  if (shouldReuse) {
    vnode.children().forEach((childVnode, childIndex) => {
      const currentDom = domRef.childNodes[childIndex]
      updateHandler(childVnode, childIndex, currentDom, domRef)
    })
  } else {
    // TODO 这里不复用的情况太宽泛了！！！！，没有考虑只重写 attributes 的情况
    parent.insertBefore(createElement(vnode), domRef)
    parent.removeChild(domRef)
  }
}

export default function createDOMRenderer(/* {invoke} */) {
  return {
    initialDigest(vnodesTraversor, rootRef) {
      vnodesTraversor.forEach((vnode) => {
        rootRef.appendChild(createElement(vnode))
      })
    },
    updateDigest(patchTraversor, domRefs) {
      const parent = domRefs[0].parentNode
      patchTraversor.forEach((vnode, index) => {
        updateHandler(vnode, index, domRefs[index], parent)
      })
    },
    batch() {

    },
  }
}
