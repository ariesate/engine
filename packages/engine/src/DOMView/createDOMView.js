import { createElement, updateElement } from './dom'
import initialDigest from './initialDigest'
import updateDigest from './updateDigest'
import { partialRight } from '../util'

export default function createDOMRenderer({ invoke, initialDigest: initialDigestIntercepter, updateDigest: updateDigestIntercepter }, rootDomElement) {
  const view = {
    // CAUTION svg not support yet
    createElement: partialRight(createElement, false, invoke),
    updateElement: partialRight(updateElement, invoke),
    createFragment() {
      return document.createDocumentFragment()
    },
    getRoot: () => rootDomElement,
    initialDigestIntercepter,
    updateDigestIntercepter,
  }

  return {
    initialDigest: ctree => initialDigest(ctree, view),
    updateDigest: cnode => updateDigest(cnode, view),
  }
}
