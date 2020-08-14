import { walkRawVnodes } from './common';
import $ from 'jquery'

export function match() {

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
      if (vnode.type.toUpperCase() !== currentDomNode.nodeName) throw new Error(`type not match : ${vnode.type.toUpperCase()} | ${currentDomNode.nodeName}`)
      // compare className
      const classNames = vnode.className ? vnode.className.split(/\s+/) : []
      const domClassNames = Array.from(currentDomNode.classList.values())
      if (!classNames.every(name => domClassNames.includes(name))) throw new Error(`classNames not match ${classNames.join(' ')} | ${domClassNames.join(' ')}}`)
      // TODO compare style

      // TODO compare key

      // filter comment node
      if (!currentDomNode.childNodes.filter) {
        // console.log(currentDomNode.childNodes)
      }
      return [...currentDomNode.childNodes].filter(node => node.nodeType !== 8)
    }

  }, [], domNodes)
}

export function stringifyVnodes(vnodes, changeLine) {

}

