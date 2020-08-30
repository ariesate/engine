import { normalizeLeaf } from '@ariesate/are/createElement'
import VNode from '@ariesate/are/VNode'
import createFlatChildrenProxy from '../createFlatChildrenProxy'
import { isComponentVnode } from '../createAxiiController'
import { invariant, mapValues } from '../util'
import { isRef } from '../reactive'
import vnodeComputed from '../vnodeComputed'

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
 * TODO 动态节点的写法
 * Base.fragments = {
 *   Head(props, argv, fragments) {
 *    可以使用其他的 Fragments，可以递归
 *    return ...
 *   }
 * }
 *
 * fragments 可以被 Feature 劫持，用名字就行
 * mutate('Head', (result, argv) => {})
 */

/**
 * methods 用法:
 * Base.methods = {
 *   methodName: function(props, ...argv) {}
 * }
 * function 第一个参数是自动注入的 props。TODO 还要增加 derivedState？？state。
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

export class FragmentDynamic {
  constructor(name, render, localVars, nonReactive) {
    this.name = name
    this.render = render
    this.localVars = localVars
    this.nonReactive = nonReactive
  }
}


function createElementProxy() {
  const styles = []
  const listeners = {}
  const instruments = {
    getStyle() { return styles },
    getListeners() { return listeners }
  }
  return new Proxy({}, {
    get(target, key) {
      if (instruments[key]) return (...argv) => instruments[key](target, ...argv)

      return (value) => {
        if (key === 'style') {
          styles.push(value)
        } else if (typeof value === 'function'){
          if (!listeners[key]) listeners[key] = []
          listeners[key].push(value)
        } else {
          throw new Error(`unknown action: key: ${key} value: ${value}`)
        }
      }
    }
  })
}

/**
 * 1. style 设置
 * fragments[name].elements.input.style = {}
 * 2. listener 设置
 * fragments[name].elements.input.onFocus = function() {}
 * 3. 获取
 * fragments[name].elements.input.getStyle()
 * fragments[name].elements.input.getListeners()
 */
export function createElementsContainer() {
  const container = {}

  return new Proxy(container, {
    get(target, key) {
      if (!container[key]) container[key] = createElementProxy()
      return container[key]
    },
    set() {
      return false
    }
  })
}

export function createFragment(fragmentName) {
  function fragmentSetterAsFragment(localVars, nonReactive) {
    return (fragFn) => {
      return new FragmentDynamic(fragmentName, fragFn, localVars, nonReactive)
    }
  }

  // 收集 fragment 作用域下对 element 的 style 定义，对 element 的事件监听
  fragmentSetterAsFragment.elements = createElementsContainer()
  fragmentSetterAsFragment.argv = {}

  fragmentSetterAsFragment.$$modifications = []
  Object.defineProperty(fragmentSetterAsFragment, 'modify', {
    get() {
      return (modifyFn) => fragmentSetterAsFragment.$$modifications.push(modifyFn)
    },
  })

  Object.defineProperty(fragmentSetterAsFragment, 'getModifications', {
    get() {
      return () => fragmentSetterAsFragment.$$modifications
    },
  })

  return fragmentSetterAsFragment
}

function createFeatureFunctionCollector() {
  const container = {
    $$fragments: {},
    $$argv: new WeakMap()
  }

  const instruments = {
    forEach(target, fn) {
      Object.entries(target.$$fragments).forEach(fn)
    },

  }

  return new Proxy(container, {
    get(target, key) {
      if (instruments[key]) return (...argv) => instruments[key](target, ...argv)

      if (!target.$$fragments[key]) target.$$fragments[key] = createFragment(key)
      return target.$$fragments[key]
    }
  })
}


export function createFeatureFunctionCollectors() {
  const keyToFeatureFunctionCollector = new Map()
  return {
    derive(key) {
      let featureFunctionCollector = keyToFeatureFunctionCollector.get(key)
      if (!featureFunctionCollector) keyToFeatureFunctionCollector.set(key, (featureFunctionCollector = createFeatureFunctionCollector()))
      return featureFunctionCollector
    },
    filter(fn) {
      const filteredContainers = []
      keyToFeatureFunctionCollector.forEach((container, key) => {
        if (fn(key)) {
          filteredContainers.push(container)
        }
      })
      return filteredContainers
    }
  }
}


export function createIndexContainer() {
  const container = {}
  return new Proxy(container, {
    get(target, key) {
      if (!target[key]) {
        // 用 setter 伪装成了 VNode，得到 vnode 上的所有属性。针对 attributes，生成 merge proxy。这样用户直接往 attribute 上设置值就行了。
        // TODO 会不会因为 fragment 刷新，对一个 vnode attributes 执行过多次修改？？
        target[key] = (ref) => {
          Object.assign(target[key], ref, { attributes: createMergeProxy(ref.attributes)})
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


export function walkVnodes(vnodes, handle) {
  vnodes.forEach((vnode) => {
    const runChildren = (children) => walkVnodes(children, handle)

    if (handle) {
      // 这里面由 handle 自己决定要不要 runChildren
      handle(runChildren, vnode, vnodes)
    } else {
      runChildren(vnode.children, handle)
    }

  })
}

export function createDefaultMatch(featurePropsTypes) {
  return (props) => {
    if (!featurePropsTypes || Object.keys(featurePropsTypes).length === 0) return true
    return Object.keys(featurePropsTypes).some(k => props[k] !== undefined)
  }
}

export function flattenChildren(children) {
  return createFlatChildrenProxy(children)
}

export function packChildren(name, children) {
  children.name = name
  return children
}

// CAUTION slots 本身这个对象不能作为 reactive。
export function createNamedChildrenSlotProxy(slots) {
  return new Proxy(slots, {
    get(target, key) {
      return isRef(target[key]) ? target[key].value : target[key]
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
      [current] : fn(current)
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