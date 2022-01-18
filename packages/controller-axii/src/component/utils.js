import VNode from '@ariesate/are/VNode'
import { normalizeLeaf } from '../createElement'
import { isComponentVnode } from '../controller'
import { invariant, mapValues } from '../util'
import { isAtom } from '../reactive'


/**
 * Base & Feature 用法：
 * Base 是建立数据(props/state) 和视图之间的关系，是一个一次性的过程。没有任何局部变量
 * Feature 也是同样的，没有任何局部变量。所以任何时候执行都可以。
 *
 * CAUTION 关于 base 中动态变化要触发 feature 跟着变的问题。
 * 理论上 base 的任何变化上层的 feature 都应该重新进行匹配计算。因为这个匹配是动态的，不是建立静态关系。
 * feature 中的部分变化。是否有必要优化算法能根据动态变化的范围，来决定是否要重新匹配 feature ？。
 * 目前测试动态创建 10000 次 proxy 并读取属性耗时 3.24 毫秒。因此单个组件中重新计算匹配性能问题可以忽略。
 *
 * feature 的修改行为可以用 watch 来包装，如果完全没有触碰到 reactive data。那么确实可以不用再执行。
 *
 */


/**
 * Style 用法:
 * Style = function(fragments) {
 *  通过 fragments 来确定作用域。
 *  fragments.Head.types[typeName] = {
 *    attrName: attrValue
 *  }
 *
 *  或者通过 elements 来精确获取
 *  fragments.Body.elements[elementName] = {
 *    attrName: attrValue
 *  }
 * }
 *
 * attrName 可以指定匹配具体的参数。
 * color[arg1=xxx]
 *
 * attrValue 可以是函数或者具体的值。如果是函数可以获取到当前 fragments, 和上层 fragments 上所有的参数。
 * 例子：
 * // 使用参数
 * Style = (fragments) => {
 *  fragments.Head.elements.element1 = {
 *    color: function(props, argv) {
 *    }
 *  }
 *
 *  定义参数
 *  fragments.Head.argv.active = argv((props, argv, vnode, argvToDefine) => {
 *    argvToDefineDefaultValue.value = xxx
 *    1. 或者通过 vnode.ref 来得到 dom 上的值
 *    2. 或者通过 fragments 的其他节点来建立和 argvToDefine 的联系。
 *  }, argvToDefineDefaultValue)
 * }
 *
 * CAUTION 注意，不管怎么写，都是通过一个函数来在 computed 中建立数据跟数据之间的关系。
 */

/**
 * Layout 用法:
 * 类似于 Style，但是在组件内部是写在 render 函数里的。
 * 这里暴露 Layout 是让外部有机会通过替换 Layout 来动态修改部分值。
 *
 */

/**
 * delegator 用法:
 * 当要用到第三方组件的时候，应该用 delegator 的方式，这样就能在运行时动态去替换掉局部了
 * base.delegator = {
 *   pagination: Pagination
 * }
 *
 */



export function createIndexContainer() {
  const container = {}
  return new Proxy(container, {
    get(target, key) {
      if (!target[key]) {
        // 用 setter 伪装成了 VNode，得到 vnode 上的所有属性。针对 attributes，生成 merge proxy。这样用户直接往 attribute 上设置值就行了。
        // TODO 会不会因为 fragment 刷新，对一个 vnode attributes 执行过多次修改？？
        target[key] = (ref) => {
          Object.assign(target[key], ref, { attributes: createMergeProxy(ref.attributes) })
        }
      }
      return target[key]
    },
  })
}

export function makeCallbackName(methodName) {
  return `on${methodName[0].toUpperCase()}${methodName.slice(1)}`
}

export function makeMethodName(callbackName) {
  return `${callbackName[2].toLowerCase()}${callbackName.slice(3)}`
}

export function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}

export function replaceSlot(vnodes, childrenBySlot, availableArgv) {
  walkVnodes(vnodes, (walkChildren, vnode) => {
    if (isComponentVnode(vnode)) return false
    if (!(vnode instanceof VNode)) return false
    if (!vnode.attributes) return false

    if (!vnode.attributes.slot) return vnode.children ? walkChildren(vnode.children) : null

    invariant(vnode.children === undefined || vnode.children.length === 0, `${vnode.type} cannot have both children and be slot `)
    const slotChild = childrenBySlot[vnode.attributes.name || vnode.type]
    if (slotChild) {
      vnode.children = [normalizeLeaf((typeof slotChild === 'function') ? slotChild(availableArgv) : slotChild)]
    } else {
    }
  })
}


export function hasComputedAttr(rulesToSearch) {
  if (!rulesToSearch) return false

  return rulesToSearch.some((rule) => {
    return Object.values(rule).some(v => typeof v === 'function')
  })
}


export function createWalker() {
  const visited = new WeakSet()
  return function walkVnodes(vnodes, handle) {
    vnodes.forEach((vnode) => {
      if (visited.has(vnode)) throw new Error('infinite loop detected')
      const runChildren = (children) => walkVnodes(children, handle)
      if (vnode) visited.add(vnode)

      if (handle) {
        // 这里面由 handle 自己决定要不要 runChildren
        handle(runChildren, vnode, vnodes)
      } else {
        runChildren(vnode.children, handle)
      }

    })
  }
}


export function walkVnodes(vnodes, handle, parent) {
  vnodes.forEach((vnode) => {
    const runChildren = (children) => walkVnodes(children, handle, vnode)

    if (handle) {
      // 这里面由 handle 自己决定要不要 runChildren
      handle(runChildren, vnode, vnodes, parent)
    } else {
      runChildren(vnode.children)
    }

  })
}

export function createDefaultMatch(featurePropsTypes) {
  return (props) => {
    if (!featurePropsTypes || Object.keys(featurePropsTypes).length === 0) return true
    return Object.keys(featurePropsTypes).some(k => props[k] !== undefined)
  }
}


export function packChildren(name, children) {
  children.name = name
  return children
}

// CAUTION slots 本身这个对象不能作为 reactive。
// TODO 应该要改成可以的才行。不然传过来的 children 就没法动态化了。
export function createNamedChildrenSlotProxy(namedChildren) {
  return new Proxy(namedChildren, {
    get(target, key) {
      return isAtom(target[key]) ? target[key].value : target[key]
    }
  })
}

export function createCallback(props, methodFn, methodName) {
  const callbackName = makeCallbackName(methodName)
  return (...argv) => {
    // call外部的回调
    const callMethod = () => {
      methodFn(props, ...argv)
    }
    if (props[callbackName]) {
      props[callbackName](callMethod)
    } else {
      callMethod()
    }
  }
}

export function chainMethod(originMethod, methodFn) {
  return (...argv) => {
    return methodFn(...argv, originMethod)
  }
}

export function zipObject(keys, fn) {
  return keys.reduce((result, current) => {
    return {
      ...result,
      [current]: fn(current)
    }
  }, {})
}

export function tranform(obj, fn) {

}

export function compose(methods) {
  if (!methods.length) return
  const last = methods[methods.length - 1]
  return (...argv) => {
    last(...argv, compose(methods.slice(0, methods.length - 1)))
  }
}

export function createStylesheet(attributes = {}) {
  const styleTag = document.createElement('style');
  styleTag.type = 'text/css';
  Object.entries(attributes).forEach(([attrName, attrValue]) => {
    styleTag.setAttribute(`data-${attrName}`, attrValue);
  })

  return styleTag
}

export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i
function withCamelCase(last, current) {
  return last.concat(current,
    /-/.test(current) ?
      current.replace(/(.+)-([a-z])(.+)/, (match, first, letter, rest) => {
        return `${first}${letter.toUpperCase()}${rest}`
      }) :
      []
  )
}

export const IS_ATTR_NUMBER = new RegExp(`^(${[
  'flex',
  'flex-grow',
  'flex-shrink',
  'line-height',
  'z-index'
].reduce(withCamelCase, []).join('|')})$`, 'i')

export function normalizeStyleValue(k, v) {
  return (typeof v === 'number' && !IS_NON_DIMENSIONAL.test(k) && !IS_ATTR_NUMBER.test(k)) ? (`${v}px`) : v
}


export function isDynamicObject(obj) {
  return obj && (typeof obj === 'function' || Object.values(obj).some(v => typeof v === 'function'))
}

export function computeDynamicObject(obj, ...argv) {
  return (typeof obj === 'function') ? obj(...argv) : mapValues(obj, (v) => v(...argv))
}

export function camelToKebab(str) {
  return str.replace(/[A-Z]/g, (char) => {
    return `-${char.toLowerCase()}`
  })
}

export function appendRule(stylesheet, className, name, rules) {
  const rulesStr = Object.entries(rules).map(([k, v]) => {
    return `${camelToKebab(k)}: ${normalizeStyleValue(k, v)} !important`
  }).join(';')
  // TODO 驼峰转 - 写法
  // CAUTION 最后一个参数，一定要插入到尾部。默认是插到头部，会导致不能覆盖。做成一个链表? 这样就可以删除已有的了。
  stylesheet.sheet.insertRule(`.${className}:${name} {${rulesStr}}`, stylesheet.sheet.cssRules.length)
}
