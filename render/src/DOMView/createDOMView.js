import { createElement, updateElement } from './dom'
import initialDigest from './initialDigest'
import updateDigest from './updateDigest'
import { partialRight } from '../util'

export default function createDOMRenderer({ invoke, collectInitialDigestedCnode, collectUpdateDigestedCnode }, rootDomElement) {
  const view = {
    // TODO 暂时不支持 svg
    createElement: partialRight(createElement, false, invoke),
    updateElement: partialRight(updateElement, invoke),
    createFragment() {
      return document.createDocumentFragment()
    },
    getRoot: () => rootDomElement,
    collectInitialDigestedCnode,
    collectUpdateDigestedCnode,
  }

  return {
    initialDigest: ctree => initialDigest(ctree, view),
    updateDigest: cnode => updateDigest(cnode, view),
  }
}
