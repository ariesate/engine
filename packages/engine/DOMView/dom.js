import {each, nextJob} from '../util'
import { IS_NON_DIMENSIONAL, IS_ATTR_NUMBER } from '../constant'

export function normalizeStyleValue(k, v) {
  return (typeof v === 'number' && !IS_NON_DIMENSIONAL.test(k) && !IS_ATTR_NUMBER.test(k)) ? (`${v}px`) : v
}

/** Attempt to set a DOM property to the given value.
 *  IE & FF throw for certain property-value combinations.
 */
function setProperty(node, name, value) {
  try {
    node[name] = value
  } catch (e) {
    /* eslint-disable no-console */
    console.error(e)
    /* eslint-enable no-console */
  }
}

function eventProxy(e) {
  const listener = this._listeners[e.type]
  /**@jsx 只有 focus event 是延迟处理的，这是因为 digest 时候的 removeChild 也会触发 focus event，这就使得更新不稳定了*/
  if (e instanceof FocusEvent) {
    nextJob(() => {
      Array.isArray(listener) ? listener.forEach(l => l(e)) : listener(e)
    })
  } else {
    Array.isArray(listener) ? listener.forEach(l => l(e)) : listener(e)
  }
}

export function setAttribute(node, name, value, isSvg) {
  if (name === 'className') name = 'class'

  if (name === 'key' || name === 'ref') {
    // ignore
  } else if (name === 'class' && !isSvg) {
    node.className = value || ''
  } else if (name === 'style') {
    if (!value || typeof value === 'string') {
      node.style.cssText = value || ''
    }

    if (value && typeof value === 'object') {
      each(value, (v, k) => {
        if (value[k] === undefined) {
          node.style[k] = ''
        } else {
          node.style[k] = normalizeStyleValue(k, v)
        }
      })
    }
  } else if (name === 'dangerouslySetInnerHTML') {
    if (value) node.innerHTML = value.__html || ''
  } else if (/^on/.test(name)) {
    const useCapture = name !== (name = name.replace(/Capture$/, ''))
    name = name.toLowerCase().substring(2)
    if (value) {
      node.addEventListener(name, eventProxy, useCapture)
    } else {
      node.removeEventListener(name, eventProxy, useCapture)
    }

    (node._listeners || (node._listeners = {}))[name] = value
  } else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
    setProperty(node, name, value == null ? '' : value)
    if (value == null || value === false) node.removeAttribute(name)

  } else {
    const ns = isSvg && (name !== (name = name.replace(/^xlink\:?/, '')))
    if (value == null || value === false) {
      if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase())
      else node.removeAttribute(name)
    } else if (typeof value !== 'function') {
      if (ns) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value)
      } else {
        node.setAttribute(name, value)
      }
    }
  }
}

function setAttributes(attributes, element, isSVG, invoke) {
  each(attributes, (attribute, name) => {
    if (/^on[A-Z]/.test(name) && (typeof attribute === 'function' || Array.isArray(attribute))) {
      const callbacks = Array.isArray(attribute) ? attribute : [attribute]
      setAttribute(element, name, callbacks.map(callback => (...argv) => invoke(callback, ...argv)), isSVG)
    } else if (name === 'style' || name==='dangerouslySetInnerHTML' || !/^_+/.test(name) && !(typeof attribute === 'object')){
      // 不允许 _ 开头的私有attribute，不允许 attribute 为数组或者对象。除非是 style。
      setAttribute(element, name, attribute, isSVG)
    } else {
      console.warn(`invalid attribute: ${name}, value: ${typeof attribute}, ${attribute}`)
    }
  })
}

function setData(dataset, element) {
  if (!dataset) return
  each(dataset, (v, k) => {
    element.dataset[k] = v
  })
}

export function createElement(node, invoke) {
  if (node.type === String) return document.createTextNode(node.value)
  const element = node.isSVG
    ? document.createElementNS('http://www.w3.org/2000/svg', node.type)
    : document.createElement(node.type)

  if (node.attributes) {
    setAttributes(node.attributes, element, node.isSVG, invoke)
  }

  if (node.dataset) {
    setData(node.dataset, element)
  }

  return element
}

export function updateElement(vnode, element, invoke) {
  if (vnode.type === String) {
    element.nodeValue = vnode.value
  } else {
    setAttributes(vnode.attributes, element, vnode.isSVG, invoke)
    setData(vnode.dataset, element)
  }
}
