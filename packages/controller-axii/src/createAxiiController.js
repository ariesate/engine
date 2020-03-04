/**
 * CAUTION
 * axii 的渲染过程实际上是建立 reactive 数据与组件实例之间联系的过程，而不是一个动态的计算过程。
 * 具体表现在组件只会因为依赖的 reactive 数据变化而重新 render，父组件的变化是不会让子组件重新 render 的。
 * 所以不要在 vnodeComputed 里面或者任何组件里去改变传给子组件的数据的引用，包括传给子组件的 children 的结构。
 */

import { cloneElement } from '@ariesate/are/createElement'
import { UNIT_INITIAL_DIGEST } from '@ariesate/are/constant'
import propTypes from './propTypes'

import { walkVnodes, isComponentVnode, reverseWalkCnodes } from './common'
import { invariant, mapValues, replaceItem } from './util'
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
  const type = (changeCallback, saveWatchToken, onUnmount) => {
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
      // 一旦碰到 component vnode 就要中断掉。里面的 replace 要交给这个组件 render 的时候处理。
      if (isComponentVnode(vnode)) return [false, undefined, true]

      if (hasRefProps(vnode)) {
        return [true, createVirtualCnodeForReactiveProps(vnode), false]
      } else if (isRef(vnode)) {
        return [true, createVirtualCnodeForComputedVnodeOrText(vnode), false]
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
      /**
       * TODO 在 render 中要处理啊普通组件的 Style 函数。只能生成 class 文件，没法动态去找到匹配的节点。
       * 这时就需要处理动态变化的问题了。
       * Style 函数接受的参数就是props/state，这使得如果有些片段要不想独立成组件，但又需要传参，就坐不到了。例如 TodoItem 的 active，如果没有独立出来。无法处理。
       * 因此，增加一个规则，只要片段有名字，就可以通过 var-xxx={} 的方式传值。
       *
       * Style 也可以做个类似于 vnode 的结构，通过 diff 来动态改变 stylesheet。动态改变的时候比较麻烦，因为只有 index，没有引用。
       * 可能得考虑用多个 style sheet。
       *
       * 如果要像 houdini 一样来支持根据一些需要动态创建 div 的样式，那就得"提前知晓节点是否匹配"。但如果能提前知道，也就不需要 stylesheet 了。
       * 还是特殊样式只能定义在有名字的节点上？这样能迅速匹配。
       *
       * 关于"类型形式"的范匹配如何处理？反过来用 use 的方式。
       *
       */
      initialRender(cnodeToInitialize, parent) {
        /**
         * CAUTION 目前还是只有 virtual cnode 会更新，普通组件不会更新。不确定未来会不会有需要。
         */
        let result
        // 建立 watch 关系，这里把这个函数引用单独声明出来，这样即使 type 中 subscribe 执行多次，由于用的是 set，也不会多次执行回调。
        cnodeToInitialize.changeCallback = (isUnchanged) => {
          // 可能会受到 isUnchanged === true 的消息
          !isUnchanged && scheduler.collectChangedCnodes([cnodeToInitialize])
        }

        cnodeToInitialize.watchTokens = new Set()
        cnodeToInitialize.saveWatchToken = (token) => {
          cnodeToInitialize.watchTokens.add(token)
        }

        // unmount 的时候也会调用
        cnodeToInitialize.clearWatchTokens = () => {
          // token 引用没了，trigger 就不会再发生了。
          cnodeToInitialize.watchTokens.forEach(token => destroyComputed(token))
          cnodeToInitialize.watchTokens.clear()
        }

        // 1. virtualCnode，这是在正常 cnode render 过程中动态分析返回结果创造出来的
        if (cnodeToInitialize.type.isVirtual) {
          cnodeToInitialize.unmount = () => {
            cnodeToInitialize.clearWatchTokens()
            // CAUTION destroy 的顺序不能乱，必须是从依赖->被依赖项。state 可能依赖于 localProps， 所以先 destroy state。
            cnodeToInitialize.state && Object.values(cnodeToInitialize.state).forEach(state => destroyComputed(state))
            cnodeToInitialize.localProps && Object.values(cnodeToInitialize.localProps).forEach(prop => destroyComputed(prop))
          }

          cnodeToInitialize.virtualRender = () => {
            cnodeToInitialize.clearWatchTokens()
            return cnodeToInitialize.type(cnodeToInitialize.changeCallback, cnodeToInitialize.saveWatchToken)
          }

          result = cnodeToInitialize.virtualRender()
        } else {
          // 2. 普通组件
          cnodeToInitialize.localProps = {}
          // TODO 还要支持本身的 unmount
          cnodeToInitialize.unmount = () => {
            cnodeToInitialize.clearWatchTokens()
            cnodeToInitialize.state && Object.values(cnodeToInitialize.state).forEach(state => destroyComputed(state))
            Object.values(cnodeToInitialize.localProps).forEach(prop => destroyComputed(prop))
          }

          // 存起来，之后 updateRender 就不再计算了。注意下面的 children 还是重新算
          cnodeToInitialize.injectedProps = createInjectedProps(cnodeToInitialize)
          const hasChildren = cnodeToInitialize.props.children.length !== 0
          cnodeToInitialize.injectedProps.children = hasChildren ?
            createChildrenProxy(cnodeToInitialize.props.children) :
            cnodeToInitialize.props.children

          cnodeToInitialize.virtualRender = () => {
            cnodeToInitialize.clearWatchTokens()
            // 如果 render 完发现 children 没动过，返回的结果里要替换回来。免得 painter 去渲染的时候读了 proxy。
            let result = cnodeToInitialize.type(cnodeToInitialize.injectedProps, cnodeToInitialize.ref)
            if (hasChildren && !cnodeToInitialize.injectedProps.children.touched) {
              // 替换掉 result 中的 children proxy 为原本的 children
              result = replaceChildrenProxy(result,
                cnodeToInitialize.injectedProps.children,
                cnodeToInitialize.props.children
              )
              // CAUTION 要清理回来，因为下次还会用这个 proxy。
              cnodeToInitialize.injectedProps.children.touched = false
            }
            return result
          }
          // 只会 replace 第一层的，碰到 component 节点就不处理了，交个它 render 的时候处理。
          result = cnodeToInitialize.virtualRender()
          const [layoutProps, originLayoutProps] =layoutManager.processLayoutProps(cnodeToInitialize.props)

          if (layoutProps) {
            // console.log(layoutProps, result)
            // TODO 这里的 attributes 和 props 区别???
            if(isComponentVnode(result)) {
              result.attributes = Object.assign({}, result.attributes, originLayoutProps)
            } else {
              result.attributes = Object.assign({}, result.attributes, layoutProps)
            }
          }

          // CAUTION 直接在这里处理并生成 Style，不能再 digest 之后，否则会出现闪动。
          styleManager.add(cnodeToInitialize)
        }

        /**
         * 不管是哪一种，最后都要继续替换。如果有 vnodeComputed 嵌套的情况，每次处理的时候只替换一层。
         * 下一层的处理等到当前这层变成了 virtualCnode，render 之后又回到这里继续处理。
        */
        return replaceReactiveWithVirtualCnode(result)
      },
      updateRender(virtualCnodeToUpdate) {
        /**
         * 会进行 updateRender 组件只有两种情况:
         * 1. virtualCnode。也可以理解成 cnode 中使用 reactive 的片段更新。
         * 2. 在 render 过程中读取了 children 上的 reactive prop 或者 vnodeComputed 的 cnode.
         *
         * 其他情况都不会更新，包括使用 vnodeComputed 创建的数组中 key 相同的组件。这是通过在 filterNext 中丢掉 toRemain 实现的。
         * 所以不要在 vnodeComputed 中去改变 prop 的引用。
         */
        return replaceReactiveWithVirtualCnode(virtualCnodeToUpdate.virtualRender())
      },
    },
    supervisor: {
      filterNext(result) {
        const { toInitialize, toDestroy = {} } = result

        reverseWalkCnodes(Object.values(toDestroy), cnode => {
          cnode.unmount && cnode.unmount()
        })
        // CAUTION 是否仍然保持 通过 props 更新的能力？
        // 这种情况只存在于 vnodeComputed 中，变成 vnodeComputed 中是否允许
        // 改变产生的 vnode 的 props？如果允许，那么 vnodeComputed 中可以再动态生成 computed。
        // 如果不允许，那么就是不允许 动态改变 props 的绑定数据，不允许动态创建 computed，不允许动态创建 props。
        // 不允许，如果需要动态创建，应该生成新组件，用 derive。
        // vnodeComputed 只适用于不创建、不修改绑定的情况。
        return { toPaint: toInitialize, toDispose: toDestroy }
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
         vnode.ref(ref)
      },
      hijackElement: (vnode, cnode) => {
        /**
         * 读取 layout 样式，写到 style 上。也可以写到 class 上，如果写到 class 上，就用 Mutation Observer 来监听卸载。
         */
        if (layoutManager.match(vnode)) {
          const style = layoutManager.parse(vnode.attributes, vnode)
          if (style) {
            vnode.attributes.style = style
          }
        }
        return vnode
      },
    },

    isComponentVnode(vnode) {
      return (typeof vnode.type === 'function') && vnode.type !== String && vnode.type !== Array
    },

    paint: vnode => ctree = scheduler.startInitialSession(vnode),
    receiveScheduler: s => scheduler = s,
    apply: fn => scheduler.startUpdateSession(fn),
    dump() {},
    getCtree: () => ctree,
  }
}
