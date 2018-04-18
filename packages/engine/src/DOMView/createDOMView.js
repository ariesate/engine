import { createElement, updateElement } from './dom'
import initialDigest from './initialDigest'
import updateDigest from './updateDigest'
import { partialRight } from '../util'
import { isComponentVnode as defaultIsComponentVnode} from '../common'

export default function createDOMRenderer({ invoke }, rootDomElement, isComponentVnode = defaultIsComponentVnode,) {
  const view = {
    // CAUTION svg not support yet
    createElement: partialRight(createElement, false, invoke),
    updateElement: partialRight(updateElement, invoke),
    createFragment() {
      return document.createDocumentFragment()
    },
    isComponentVnode,
    getRoot: () => rootDomElement,
  }

  return {
    initialDigest: cnode => initialDigest(cnode, view),
    updateDigest: cnode => updateDigest(cnode, view),
  }
}
