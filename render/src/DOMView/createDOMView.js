import { createElement, updateElement } from './dom'
import initialDigest from './initialDigest'
import updateDigest from './updateDigest'

export default function createDOMRenderer(observer, rootDomElement) {
  const tools = {
    createElement,
    updateElement,
    createFragment() {
      return document.createDocumentFragment()
    },
    getRoot: () => rootDomElement,
  }

  return {
    initialDigest: ctree => initialDigest(ctree, tools),
    updateDigest: cnode => updateDigest(cnode, tools),
  }
}
