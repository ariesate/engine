import { walkRawVnodes } from './common';
import $ from 'jquery'
import initialDigest  from './DOMView/initialDigest';

export function match() {
  // TODO
}

function getStyleDeclaration(document, css) {
  const styles = {}

  // The next block is necessary to normalize colors
  const copy = document.createElement('div')
  Object.keys(css).forEach(property => {
    copy.style[property] = css[property]
    styles[property] = copy.style[property]
  })

  return styles
}


function isSubset(styles, computedStyle) {
  return (
    !!Object.keys(styles).length &&
    Object.entries(styles).every(
      ([prop, value]) =>
        computedStyle[prop] === value ||
        computedStyle.getPropertyValue(prop.toLowerCase()) === value,
    )
  )
}



export function partialMatch(inputDomNodes, inputVnode) {
  const isArray = Array.isArray(inputVnode)
  const vnodes = isArray ? inputVnode : [inputVnode]
  const domNodes = isArray ? inputDomNodes : [inputDomNodes]
  walkRawVnodes(vnodes, (vnode, currentPath, context) => {
    // 要过滤掉 comment
    const currentDomNode = $(context[currentPath[currentPath.length -1]]).get(0)
    // TODO 要考虑多个字符合并的情况？？？
    if (vnode.type === String) {
      if (vnode.value !== currentDomNode.textContent) throw new Error(`content not match: ${vnode.value} | ${currentDomNode.textContent}`)

    } else {
      // compare node name
      if (!currentDomNode) debugger
      if (vnode.type.toUpperCase() !== currentDomNode.nodeName) throw new Error(`type not match : ${vnode.type.toUpperCase()} | ${currentDomNode.nodeName}`)
      // compare className
      const classNames = vnode.className ? vnode.className.split(/\s+/) : []
      const domClassNames = Array.from(currentDomNode.classList.values())
      if (!classNames.every(name => domClassNames.includes(name))) throw new Error(`classNames not match ${classNames.join(' ')} | ${domClassNames.join(' ')}}`)

      if (vnode.attributes?.style) {
        const {getComputedStyle} = currentDomNode.ownerDocument.defaultView
        const expected = getStyleDeclaration(currentDomNode.ownerDocument, vnode.attributes.style)
        const received = getComputedStyle(currentDomNode)
        if (!isSubset(expected, received)) {
          throw new Error(`style not match: ${JSON.stringify(vnode.attributes.style)} | ${JSON.stringify(received)}`)
        }
      }

      return [...currentDomNode.childNodes].filter(node => node.nodeType !== 8)
    }

  }, [], domNodes)
}

export function stringifyVnodes(vnodes, changeLine) {

}

export function createDOMFromVnode(vnodes) {
  // 伪造 cnode
  const cnode = {
    ret: vnodes
  }



}

