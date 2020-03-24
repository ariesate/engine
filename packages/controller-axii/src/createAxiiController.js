/**
 * CAUTION
 * axii 的渲染过程实际上是建立 reactive 数据与组件实例之间联系的过程，而不是一个动态的计算过程。
 * 具体表现在组件只会因为依赖的 reactive 数据变化而重新 render，父组件的变化是不会让子组件重新 render 的。
 * 所以不要在 vnodeComputed 里面或者任何组件里去改变传给子组件的数据的引用，包括传给子组件的 children 的结构。
 *
 * axii 中 reactive 的内存模型：
 * reactive/ref 的持有者：
 * 1. 组件体系外的作用域。
 * 2. 组件的主体函数创建的，函数作用域。
 * 3. axii 为组件创建的 defaultProps，最后会挂载到 cnode.localProps 上。axii 持有。
 *
 * computed 的持有者：
 * 1. 函数主体创建，函数作用域持有(如果 indep 的生命周期超出当前函数，需要主动销毁)
 * 2. vnodeComputed，函数作用域持有(同上)
 *
 * computed 回收:
 * 1. 如果是 computed 中再创造出来的 computed。例如 createComponent 中 fragment 下再嵌套 fragment 就是这种情况。
 * 父 computed 再变化时，会自动回收上一次的。
 *
 * 2. 如果是 render 过程中创建的 computed，也不需要需要组件自己回收。因为 computed props 或者 vnode 所在的节点会被替换
 * 成 virtual cnode。由 virtual cnode 回收即可。
 *
 *
 * cnode 和 virtual cnode 在生命周期上的区别
 * initialRender: 两者都正常，都需要对结果再进行 reactive 替换成 virtual cnode。每次只替换一层。
 * updateRender: cnode 是父亲传递的 props 引用发生了变化时才会 update。父亲一定重新 render 了。
 *              virtual cnode 是自身 watch 触发的回调。父亲一定没有重新 render，否则自己就被卸载了。
 * unmount: cnode 一定是父亲重新 render 导致自己 unmount。filterNext 中的 toDestroy 一定是 cnode。
 *          virtual cnode unmount 一定是父亲也销毁了。filterNext 中的 toDestroy 一定不是 virtual cnode。
 *
 */

import { cloneElement } from '@ariesate/are/createElement'
import Fragment from '@ariesate/are/Fragment'
import { UNIT_INITIAL_DIGEST } from '@ariesate/are/constant'
import propTypes from './propTypes'

import { walkVnodes, reverseWalkCnodes } from './common'
import { filter, invariant, mapValues, replaceItem } from './util'
import {
  isReactiveLike,
  isRef,
  destroyComputed,
} from './reactive';
import { getMutationRunner } from './derive'
import { getDisplayValue, isDraft } from './draft'
import watch from './watch'
import { withCurrentWorkingCnode } from './renderContext'
import createChildrenProxy from './createChildrenProxy'
import LayoutManager from './LayoutManager'
import StyleManager from './StyleManager';
import { isComputed } from './reactive/effect';

const layoutManager = new LayoutManager()
const styleManager = new StyleManager()

function isFormElement(target) {
  return (target instanceof HTMLInputElement)
    || (target instanceof HTMLSelectElement)
    || (target instanceof HTMLTextAreaElement)
}

function isFormVnode(vnode) {
  return ['input', 'select', 'textarea'].includes(vnode.type)
}

export function isComponentVnode(vnode) {
  return (typeof vnode.type === 'function') && vnode.type !== String && vnode.type !== Array && vnode.type !== Fragment
}

const formElementToReactive = new WeakMap()

let currentRenderingNode = null
export function getCurrentRenderingNode() {
  return currentRenderingNode
}

function hasRefProps(vnode) {
  return vnode.props && Object.values(vnode.props).some(prop => isRef(prop))
}


function createVirtualCnodeForComputedVnodeOrText(reactiveVnode) {
  // debugger
  const type = (changeCallback, saveWatchToken) => {
    const toDisplay = isDraft(reactiveVnode) ? getDisplayValue(reactiveVnode) : reactiveVnode
    const [value, watchToken] = watch(() => toDisplay.value, () => {
      changeCallback()
    })
    saveWatchToken(watchToken)
    return value
  }

  type.isVirtual = true

  // CAUTION 伪装成了一个既是 ref 又是 component node 的节点。ref 是 children proxy 中要判断的。
  return {
    type,
    // CAUTION 这里的判断很危险，和 isRef 耦合
    _isRef: true,
    get value(){ return reactiveVnode.value }
  }
}


function createVirtualCnodeForReactiveProps(vnodeWithRefProps) {
  const type = (changeCallback, saveWatchToken) => {
    const unwrappedProps = {}
    const formVnode = isFormVnode(vnodeWithRefProps)
    Object.entries(vnodeWithRefProps.props).forEach(([name, prop]) => {
      // 普通属性
      if (!isReactiveLike(prop)) return unwrappedProps[name] = prop

      invariant(isRef(prop), `should not have non-ref reactive prop on dom attribute: ${name}`)
      const propToDisplay = isDraft(prop) ? getDisplayValue(prop) : prop
      const [propValue, watchToken] = watch(() => propToDisplay.value, changeCallback)
      unwrappedProps[name] = propValue
      saveWatchToken(watchToken)
      // 保存一下 form value 类型的 ref, 之后用来修正实现 controller form element.
      if (formVnode && name === 'value') {
        const originRef = unwrappedProps.ref
        unwrappedProps.ref = (e) => {
          formElementToReactive.set(e, propToDisplay)
          originRef && originRef(e)
        }
      }
    })
    return cloneElement(vnodeWithRefProps, unwrappedProps)
  }

  type.isVirtual = true

  return {
    type,
  }
}

function replaceVnodeWith(vnode, matchAndReplace) {
  // return vnode
  const isArray = Array.isArray(vnode)
  const start = isArray ? vnode : [vnode]
  walkVnodes(start, (vnode, currentPath, parentCollection) => {
    const [matched, next, shouldStop] = matchAndReplace(vnode)
    if (matched) replaceItem(parentCollection, vnode, next)
    return shouldStop
  })
  return isArray ? vnode : start[0]
}

function replaceChildrenProxy(vnode, proxy, origin) {
  if (vnode === proxy) return origin
  return replaceVnodeWith(vnode, (vnode) => {
    if (vnode === proxy) return [true, origin, true]
    return [false]
  })
}


function replaceReactiveWithVirtualCnode(renderResult) {
  return replaceVnodeWith(renderResult, (vnode) => {
      if (!vnode) return [false]
      // 一旦碰到 component vnode 就要中断掉。里面的 replace 要交给这个组件 render 的时候自己处理。
      if (isComponentVnode(vnode)) return [false, undefined, true]
      // 替换为 virtual cnode 之后也要停止 walk，让 virtual cnode render 的时候再处理里面的。
      if (hasRefProps(vnode)) {
        return [true, createVirtualCnodeForReactiveProps(vnode), true]
      } else if (isRef(vnode)) {
        return [true, createVirtualCnodeForComputedVnodeOrText(vnode), true]
      }

      return [false]
  })
}



const activeEvent = (function() {
  let currentEvent = null
  let shouldPreventDefault = false
  function withEvent(event, handler) {
    currentEvent = event
    handler(() => shouldPreventDefault)
    currentEvent = null
    shouldPreventDefault = false
  }

  function preventCurrentEventDefault() {
    if (currentEvent) shouldPreventDefault = true
  }

  return {
    withEvent,
    preventCurrentEventDefault
  }
})()


function createInjectedProps(cnode) {
  const { props, localProps } = cnode
  const { propTypes: thisPropTypes } = cnode.type

  Object.entries(thisPropTypes || {}).forEach(([propName, propType]) => {
    if (!(propName in props)) {
      localProps[propName] = propType.defaultValue
    }
  })

  const mergedProps = { ...props, ...localProps }
  // 开始对其中的 mutation 回调 prop 进行注入。
  const injectedProps = thisPropTypes ? mapValues(thisPropTypes, (propType, propName) =>
    propType.is(propTypes.callback) ? (mutateFn) => {
      const listener = mergedProps[propName]

      const mutationRunner = getMutationRunner(cnode, mutateFn)
      const shouldStopApply = mutationRunner((nextProps) => {
        // 显式 return false 表示要 stopApply
        return listener ? listener(nextProps, mergedProps) === false : false
      })
      if (shouldStopApply) activeEvent.preventCurrentEventDefault()
    } : mergedProps[propName]

  ) : mergedProps

  return injectedProps
}

/**
 * ComponentNode
 */
class ComponentNode {
  constructor() {
    this.watchTokens = new Set()
    this.localProps = {}
    // render 过程中创造的 reactive prop/reactive vnode 收集在这里，之后要回收。
    this.computed = []
    this.saveWatchToken = this.saveWatchToken.bind(this)
  }

  saveWatchToken(token) {
    this.watchTokens.add(token)
  }
  // unmount 的时候也会调用
  clearWatchTokens () {
    // token 引用没了，trigger 就不会再发生了。
    this.watchTokens.forEach(token => destroyComputed(token))
    this.watchTokens.clear()
  }

  clearComputed()  {
    this.computed.forEach(computed => destroyComputed(computed))
    this.computed = []
  }
  collectComputed(vnodes) {
    walkVnodes(Array.isArray(vnodes) ? vnodes : [vnodes], (vnode) => {
      // CAUTION 注意，这里要穿透 Component 收集，只要是本作用域产生的 computed。都要收集起来
      // 但是不穿透 computed。因为 computed 自己会处理内部的 computed.
      if (isComputed(vnode)) {
        this.computed.push(vnode)
        return false
      } else {
        Object.values(vnode.attributes || {}).forEach(value => {
          if (isComputed(value)) this.computed.push(vnode)
        })
      }
    })
  }
  // TODO 还要支持本身的 unmount
  unmount() {
    this.clearWatchTokens()
    // CAUTION destroy 的顺序不能乱，必须是从依赖->被依赖项。state 可能依赖于 localProps， 所以先 destroy state。
    if (this.type.isVirtual) return

    // 1. 回收 render 中间产生的所有 computed。
    this.clearComputed()
    // 2. 回收 state computed, state 是从 props 产生的。
    this.state && Object.values(this.state).forEach(state => destroyComputed(state))
    // 3. 回收 props computed.
    Object.values(this.localProps).forEach(prop => destroyComputed(prop))
  }
  render() {
    return this.type.isVirtual ? this.virtualCnodeRender() : this.cnodeRender()
  }
  cnodeRender() {
    this.clearWatchTokens()
    this.clearComputed()

    // 开始处理 props
    const injectedProps = createInjectedProps(this)
    const hasChildren = this.props.children.length !== 0
    injectedProps.children = hasChildren ?
      createChildrenProxy(this.props.children) :
      this.props.children

    let result = this.type(injectedProps, this.ref)
    // 收集所产生的 computed。之后要销毁
    this.collectComputed(result)

    // 如果 render 完发现 children 没被动过，返回的结果里要替换回来。免得 painter 去渲染的时候读了 proxy。
    if (hasChildren && !injectedProps.children.touched) {
      // 将 result 中的 children proxy 替换回原本的 children
      result = replaceChildrenProxy(result,
        injectedProps.children,
        this.props.children
      )
    }
    return result
  }
  virtualCnodeRender() {
    this.clearWatchTokens()
    return this.type(this.changeCallback, this.saveWatchToken)
  }
}

/**
 * createAxiiController
 *
 */
export default function createAxiiController() {
  let scheduler = null
  let ctree = null

  return {
    renderer: {
      rootRender(cnode) {
        return cnode.type.render(cnode.props, cnode.ref)
      },

      initialRender(cnode) {
        let result
        // 建立 watch 关系，这里把这个函数引用单独声明出来，这样即使 type 中 subscribe 执行多次，由于用的是 set，也不会多次执行回调。
        cnode.changeCallback = (isUnchanged) => {
          // 可能会受到 isUnchanged === true 的消息
          !isUnchanged && scheduler.collectChangedCnodes([cnode])
        }

        result = cnode.render()

        if (!cnode.type.isVirtual) {
          // 2. 普通组件
          const [layoutProps, originLayoutProps] =layoutManager.processLayoutProps(cnode.props)

          if (layoutProps) {
            if(isComponentVnode(result)) {
              result.attributes = Object.assign({}, result.attributes, originLayoutProps)
            } else {
              result.attributes = Object.assign({}, result.attributes, layoutProps)
            }
          }

          // CAUTION 直接在这里处理并生成 Style，不能再 digest 之后，否则会出现闪动。
          styleManager.add(cnode)
        }

        /**
         * 不管是哪一种，最后都要继续替换。如果有 vnodeComputed 嵌套的情况，每次处理的时候只替换一层。
         * 下一层的处理等到当前这层变成了 virtualCnode，render 之后又回到这里继续处理。
        */
        return replaceReactiveWithVirtualCnode(result)
      },
      updateRender(cnode) {
        /**
         * 会进行 updateRender 组件只有两种情况:
         * 1. virtualCnode。也可以理解成 cnode 中使用 reactive 的片段更新。
         * 2. cnode props 的引用发生了变化。
         */
        return replaceReactiveWithVirtualCnode(cnode.render())
      },
    },
    supervisor: {
      filterNext(result) {
        const { toInitialize, toDestroy = {}, toRemain = {} } = result

        reverseWalkCnodes(Object.values(toDestroy), cnode => {
          cnode.unmount && cnode.unmount()
        })

        const toRepaint = filter(toRemain, (cnode) => {
          // 只要有属性发生了引用变化，就要重新 render。包括 children 的应用变化。
          return Object.entries(cnode.props).some(([propName, propValue]) => {
            return propValue !== cnode.lastProps[propName]
          })
        })

        return { toPaint: toInitialize, toDispose: toDestroy, toRepaint }
      },
      unit: (sessionName, unitName, cnode, startUnit) => {
        if (unitName === UNIT_INITIAL_DIGEST) styleManager.digest(cnode)
        return withCurrentWorkingCnode(cnode, startUnit)
      },

      session: (sessionName, startSession) => {
        startSession()
      },
    },

    observer: {
      invoke: (fn, e) => {
        scheduler.startUpdateSession(() => {
          activeEvent.withEvent(e, () => {
            fn(e)
            if( isFormElement(e.target) ) {
              // 1. 找到相应的 binding。
              const reactive = formElementToReactive.get(e.target)
              // 2. 始终保持 value 一直
              if (reactive) e.target.value = reactive.value
            }
          })
        })
      },
      receiveRef: (ref, vnode) => {
        if (typeof vnode.ref === 'function') {
          vnode.ref(ref)
        } else {
          vnode.ref.current = ref
        }
      },
      hijackElement: (vnode, cnode) => {
        /**
         * 读取 layout 样式，写到 style 上。也可以写到 class 上，如果写到 class 上，就用 Mutation Observer 来监听卸载。
         */
        if (layoutManager.match(vnode)) {
          const style = layoutManager.parse(vnode.attributes, vnode)
          if (style) {
            vnode.attributes.style = Object.assign({}, vnode.attributes.style, style)
          }
        }
        return vnode
      },
    },

    isComponentVnode,
    ComponentNode,
    paint: vnode => ctree = scheduler.startInitialSession(vnode),
    receiveScheduler: s => scheduler = s,
    apply: fn => scheduler.startUpdateSession(fn),
    dump() {},
    getCtree: () => ctree,
  }
}
