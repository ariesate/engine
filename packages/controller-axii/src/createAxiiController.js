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

import createElement, { cloneElement } from '@ariesate/are/createElement'
import Fragment from '@ariesate/are/Fragment'
import { UNIT_INITIAL_DIGEST, UNIT_PAINT } from '@ariesate/are/constant'
import propTypes from './propTypes'

import { reverseWalkCnodes, walkRawVnodes } from './common'
import { filter, invariant, mapValues, replaceItem, tryToRaw } from './util'
import {
  isReactiveLike,
  isRef,
  destroyComputed
} from './reactive';
import { getDisplayValue, isDraft } from './draft'
import watch from './watch'
import { withCurrentWorkingCnode, activeEvent } from './renderContext'
import LayoutManager from './LayoutManager'
import { isComputed, getComputation, collectComputed, afterDigestion } from './reactive/effect';
import { applyPatch, createDraft, finishDraft } from './produce';

const layoutManager = new LayoutManager()

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

function isPropsEqual({ children, ...props }, { children: lastChildren, ...lastProps }) {
  // 先对比 children
  if (Object.keys(children).length !== Object.keys(lastChildren).length ) return false
  if (Object.entries(children).some(([childIndex, child]) => {
    return child !== lastChildren[childIndex]
  })) return false

  // 在对比剩下的 prop
  if (Object.keys(props).length !== Object.keys(lastProps).length ) return false
  return Object.entries(props).every(([propName, propValue]) => {
    return propValue === lastProps[propName]
  })
}

const virtualCacheByCnode = new WeakMap()
function getTypeCache(cnode, currentPath) {
  let allCacheOfCnode = virtualCacheByCnode.get(cnode)
  if (!allCacheOfCnode) virtualCacheByCnode.set(cnode, (allCacheOfCnode = {}))
  const currentPathStr = currentPath.join('.')
  let currentCache = allCacheOfCnode[currentPathStr]
  if (!currentCache) allCacheOfCnode[currentPathStr] = (currentCache = {})
  return currentCache
}

function createVirtualCnodeForComputedVnodeOrText(reactiveVnode, cnode, currentPath) {
  /**
   * 建立一个多级索引，用来找到创建的 virtual type，这样就能利用引擎的 diff 避免掉重复的渲染。
   * 第一层是 cnode，第二层是 path string，节点是 { type, vnode }
   * type 始终使用一个，vnode 会动态变化，type 渲染时根据 path 去动态取最新的 vnode。
   */
  const currentCache = getTypeCache(cnode, currentPath)
  currentCache.vnode = reactiveVnode
  let { type } = currentCache
  if (!type) {
    type = () => {
      // CAUTION 要重新用 currentPath 获取数据，因为 type 会缓存住，而 reactiveVnode 是新生成的 computed
      // 这里的 currentCache 始终保持是同一个对象，
      const currentVnode = currentCache.vnode
      const toDisplay = isDraft(currentVnode) ? getDisplayValue(currentVnode) : currentVnode
      return toDisplay.value
    }

    // CAUTION 每次 watch 执行都会创建一个 computed，所以外部再调用的时候一定要使用 collectComputed 收集起来，再次调用前销毁上次的。
    type.startWatch = (cnode) => {
      const [value, watchToken] = watch(function watchReactiveVnode() {
        const toDisplay = isDraft(reactiveVnode) ? getDisplayValue(reactiveVnode) : reactiveVnode
        return toDisplay.value
      }, () => {
        // 只能这样写？因为 startWatch 的时候 cnode.changeCallback 还没有
        cnode.changeCallback()
      })
      return [watchToken]
    }

    type.isVirtual = true
    // 标记一下，因为内部结构可能变化，这个变化是无法判断的，所以永远要 rerender。
    type.shouldComponentUpdate = () => true
    type.displayName = `ReactiveVnodeComponent`

    currentCache.type = type
  }

  // CAUTION 伪装成了一个既是 ref 又是 component node 的节点。ref 是 children proxy 中要判断的。
  const vnode = createElement(type)
  Object.defineProperties(vnode, {
    // CAUTION 这里的判断很危险，和 isRef 耦合
    _isRef: {
      value: true,
    },
    value: {
      get(){
        return currentCache.vnode.value
      }
    }
  })
  return vnode
}

/**
 * 当一个节点上有 reactive 的 props 时，将这个节点也替换成一个 Component。
 * 利用 component 的能力来刷新节点。
 * 虽然这种节点的结构是确定的，但是当自己被包裹在一个 vnodeComputed 里面时，
 * 由于很可能传给该节点的 reactive props 都是在 vnodeComputed 里面生成的，和原来引用不同。
 * 如果进行深度对比也耗费性能，不如只做浅对比，有新引用就刷新。
 */
function createVirtualCnodeForReactiveProps(vnodeWithRefProps, cnode, currentPath) {
  const currentCache = getTypeCache(cnode, currentPath)
  let { type } = currentCache
  currentCache.vnode = vnodeWithRefProps
  if (!type) {
    type = () => {
      const unwrappedProps = {}
      // 注意这里应该从 currentCache 上面取。type 会复用，持有的是创建时的 vnodeWithRefProps，可能过时了。
      const currentVnode = currentCache.vnode
      const formVnode = isFormVnode(currentVnode)
      Object.entries(currentVnode.props).forEach(([name, prop]) => {
        // 普通属性
        if (!isReactiveLike(prop)) return unwrappedProps[name] = prop
        invariant(isRef(prop), `should not have non-ref reactive prop on dom attribute: ${name}`)
        const propToDisplay = isDraft(prop) ? getDisplayValue(prop) : prop

        unwrappedProps[name] = propToDisplay.value
        // 保存一下 form value 类型的 ref, 之后用来修正实现 controller form element.
        if (formVnode && name === 'value') {
          const originRef = unwrappedProps.ref
          unwrappedProps.ref = (e) => {
            formElementToReactive.set(e, propToDisplay)
            originRef && originRef(e)
          }
        }
      })
      return cloneElement(currentVnode, unwrappedProps)
    }

    type.startWatch = (cnode) => {
      const tokens = []
      Object.entries(currentCache.vnode.props).forEach(([name, prop]) => {
        if (isReactiveLike(prop)) {
          const [propValue, watchToken] = watch(() => {
            const propToDisplay = isDraft(prop) ? getDisplayValue(prop) : prop
            return propToDisplay.value
          }, () => {
            cnode.changeCallback()
          })
          tokens.push(watchToken)
        }
      })

      // 虽然这里返回了，但实际上 component 是在 render 的时候统一通过 collectComputed 收集的。
      return tokens
    }


    type.isVirtual = true
    type.displayName = `ReactivePropComponent`
    // 不管是外部来的还是内部来的，始终应该重新 render
    // 因为即使所有引用都没有变化，值也可能发生了改变。
    // 比如但某个 reactive 值变化时，组件所持的引用其实是没有变化的。
    type.shouldComponentUpdate = () => true

    currentCache.type = type
  }

  return createElement(type)
}

function replaceVnodeWith(vnode, matchAndReplace) {
  // return vnode
  const isArray = Array.isArray(vnode)
  const start = isArray ? vnode : [vnode]
  walkRawVnodes(start, (vnode, currentPath, parentCollection) => {
    const [matched, next, shouldStop] = matchAndReplace(vnode, currentPath)
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


function replaceReactiveWithVirtualCnode(renderResult, cnode) {
  return replaceVnodeWith(renderResult, (vnode, currentPath) => {
      if (!vnode) return [false]
      // 一旦碰到 component vnode 就要中断掉。里面的 replace 要交给这个组件 render 的时候自己处理。
      if (isComponentVnode(vnode)) return [false, undefined, true]
      // 替换为 virtual cnode 之后也要停止 walk，让 virtual cnode render 的时候再处理里面的。
      if (hasRefProps(vnode)) {
        return [true, createVirtualCnodeForReactiveProps(vnode, cnode, currentPath), true]
      } else if (isRef(vnode)) {
        return [true, createVirtualCnodeForComputedVnodeOrText(vnode, cnode, currentPath), true]
      }

      return [false]
  })
}

function createInjectedProps(cnode) {
  const { props, localProps } = cnode
  const { propTypes: thisPropTypes } = cnode.type

  Object.entries(thisPropTypes || {}).forEach(([propName, propType]) => {
    if (!(propName in props)) {
      // 这里和 propTypes 有约定，每次读 defaultValue 时都会用定义的 createDefaultValue 创造新的对象，
      // 所以不用担心引用的问题。
      localProps[propName] = propType.defaultValue
    }
  })

  const mergedProps = { ...props, ...localProps }
  // 开始对其中的 mutation 回调 prop 进行注入。
  const callbackProps = mapValues(thisPropTypes || {}, (propType, propName) => {

    if (!propType.is(propTypes.callback)) return mergedProps[propName]

    return (event, ...restArgv) => {
      // CAUTION 参数判断非常重要，用户既有可能把这个函数直接传给 onClick 作为回调，也可能在其他函数中手动调用。
      // 当直接传给事件回调时，由于事件回调会补足 event，而我们不需要，因此在这里判断一下。
      // 注意，我们认为用户不可能自己把 event 当第一参数传入，没有这样的需求场景。
      const runtimeArgv = (event === activeEvent.getCurrentEvent() && restArgv.length === 0) ? [] : [event, ...restArgv]

      const userMutateFn = props[propName]
      // 注意这里，defaultMutateFn 可以拿到 props 的引用，这样我们就不用在调用的时候去往第一个参数去传了。
      const defaultMutateFn = propType.createDefaultValue(props)

      const valueProps = filter(mergedProps, isReactiveLike)
      const draftProps = createDraft(mapValues(valueProps, tryToRaw))

      // 我们为开发者补足三个参数，这里和 react 不一样，我们把 event 放在了最后，这是我们按照实践中的权重判断的。
      // 因为我们的组件既是受控的又是非受控的，理论上用户只需要知道组件默认会怎么改 props 就够了，即 draftProps，
      // 常见的我们在 input onChange 中去取 event.target.value 实际上也就是去取 nextProps，如果能拿到，就不需要 event。
      // 补足参数永远放在最后，这样开发者心智负担更小。
      const extraArgv = [draftProps, props, activeEvent.getCurrentEvent()]
      defaultMutateFn(...runtimeArgv, ...extraArgv)
      // 显式的返回 false 就是不要应用原本的修改。
      // CAUTION 注意这里的补全参数设计，补全的第一参数是事件，第二参数是现在的 prop 和 nextProps
      const shouldStopApply = userMutateFn ?
        userMutateFn(...runtimeArgv, ...extraArgv) === false :
        false

      if (shouldStopApply) {
        activeEvent.preventCurrentEventDefault()
      } else {
        const propsChanges = finishDraft(draftProps)[1]
        applyPatch(valueProps, propsChanges)
      }
    }

  })

  return {...mergedProps, ...callbackProps}
}

/**
 * ComponentNode
 * 这个对象最终会传个 painter 作为创建 cnode 的依据。
 * 使用这个对象可以将很多代码从 controller 的 initialRender/updateRender 中抽出来
 */
class ComponentNode {
  constructor() {
    this.localProps = {}
    // render 过程中创造的 reactive prop/reactive vnode 收集在这里，之后要回收。
    this.computed = []
  }

  clearComputed()  {
    this.computed.forEach(computed => destroyComputed(computed))
    this.computed = []
  }
  // 组件 render 的过程中产生的所有 computed 都要收集起来！computed 是需要手动销毁的。
  collectComputed(computedArr = []) {
    this.computed.push(...computedArr)
  }
  // AXII lifeCycle: 在 supervisor 中发现是 toInitialize 的节点时调用
  willMount() {
    // virtual type 的 watch 和清理工作都放到 render 里面去做了，这样能最大化保持一致性。见 virtualCnodeRender
  }
  // AXII lifeCycle: 在 supervisor 中发现不存在了时直接调用。
  unmount() {
    // 1. 回收 render 中间产生的所有 computed。包括 token，其实也是 computed。
    this.clearComputed()
    if (this.type.isVirtual) return

    // CAUTION destroy 的顺序不能乱，必须是从依赖->被依赖项。state 可能依赖于 localProps， 所以先 destroy state。
    // 2. 回收 state computed, state 是从 props 产生的。
    this.state && Object.values(this.state).forEach(state => destroyComputed(state))
    // 3. 回收自己创建的缺省 props computed.
    Object.values(this.localProps).forEach(prop => destroyComputed(prop))
  }
  // AXII lifeCycle: willUpdate。
  willUpdate() {
  // virtual type 的 watch 和清理工作都放到 render 里面去做了，这样能最大化保持一致性。见 virtualCnodeRender
  }
  render() {
    // 收集新所产生的 computed。之后要销毁。不管是不是 virtual，都可能产生。
    this.clearComputed()
    let result
    const innerComputedArr = collectComputed(() => {
      // 在这其中产生的 watchToken 也会一起收集，因为也是 computed。
      result = this.type.isVirtual ? this.virtualCnodeRender() : this.cnodeRender()
    })
    this.collectComputed(innerComputedArr)
    return result
  }
  cnodeRender() {
    // 开始处理 props
    // CAUTION 注意，这里不再自动为用户创建 flatten children proxy
    // 和 react 保持一样，用户需要手动去创建。
    // 同时当用户触碰 children 的时候，应该自己包裹在 computed 里面监听 children 的变化。 和其他 props 没有区别。
    return this.type(createInjectedProps(this), this.ref)
  }
  virtualCnodeRender() {
    const result = this.type()
    // CAUTION 不再需要单独收集 watch token，因为在 render() 里面统一作为 computed 收集了。
    this.type.startWatch(this)
    return result
  }
}

/**
 * createAxiiController
 *
 */
export default function createAxiiController() {
  let scheduler = null
  let ctree = null

  const changedCnodes = []
  function scheduleToRepaint() {
    scheduler.collectChangedCnodes(changedCnodes.splice(0))
  }

  return {
    renderer: {
      rootRender(cnode) {
        return cnode.type.render(cnode.props, cnode.ref)
      },

      initialRender(cnode) {
        let result
        cnode.changeCallback = () => {
          changedCnodes.push(cnode)
          // 每个 cnode 变化都会把当前 cnode 进去，但是 afterDigestion 会合并回调，所以 scheduleToRepaint 只会在最后调用一次
          // 所以我们的变化的方式是先 digest 完所有的数据，然后调用 callback ，开始 repaint 受影响的节点。
          afterDigestion(scheduleToRepaint)
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

        }

        /**
         * 不管是哪一种，最后都要继续替换。如果有 vnodeComputed 嵌套的情况，每次处理的时候只替换一层。
         * 下一层的处理等到当前这层变成了 virtualCnode，render 之后又回到这里继续处理。
        */
        return replaceReactiveWithVirtualCnode(result, cnode)
      },
      updateRender(cnode) {
        /**
         * 会进行 updateRender 组件只有两种情况:
         * 1. virtualCnode。也可以理解成 cnode 中使用 reactive 的片段更新。
         * 2. cnode props 的引用发生了变化。
         */
        return replaceReactiveWithVirtualCnode(cnode.render(), cnode)
      },
    },
    supervisor: {
      filterNext(result) {
        const { toInitialize, toDestroy = {}, toRemain = {} } = result

        // 通知所有的 cnode 进行 unmount，unmount 的时候通常会回收里面创建的 computed。
        reverseWalkCnodes(Object.values(toDestroy), cnode => {
          cnode.unmount && cnode.unmount()
        })

        // CAUTION 这里有 virtual type 上都写了 shouldComponentUpdate，基本都会重新渲染。
        // 默认的用户写的组件如果没有 shouldComponentUpdate, 根据 props 浅对比来决定是否更新
        const toRepaint = filter(toRemain, (cnode) => {
          if (cnode.type.shouldComponentUpdate) return cnode.type.shouldComponentUpdate(cnode)
          // CAUTION children 是不对比的！这里要特别注意，如果要对比，请组件自己提供 shouldComponentUpdate。
          return !isPropsEqual(cnode.props, cnode.lastProps)
        })

        // 通知 willUpdate，可能用户有些清理工作要做
        Object.values(toRepaint).forEach(cnodeToRepaint => {
          if (cnodeToRepaint.willUpdate) cnodeToRepaint.willUpdate()
        })

        return { toPaint: toInitialize, toDispose: toDestroy, toRepaint }
      },
      unit: (sessionName, unitName, cnode, startUnit) => {
        // 第一渲染，执行一下 willMount 的生命周期
        if (unitName === UNIT_PAINT) cnode.willMount && cnode.willMount()
        // 记录一下，其他功能要用
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
      hijackCreateElement: (vnode, cnode) => {
        // TODO
      },
      hijackDigestElement: (vnode, cnode) => {
        /**
         * 把 scopeId 写到 data attribute 上。
         * TODO 还需要更全面的劫持。这里的劫持是在创建真实的 dom 之前。
         * 我们有可能一个 vnode 是由 parent cnode 创建的，作为 children 传递给了 child cnode。
         * 这个时候这些传进去的 vnode 应该打上父组件的 id，这样父组件就还是能控制它们的样式。
         * 总体原则是，谁创建的 vnode ，就应该打上谁的标签。
         *
         * TODO createElement 也要有个 withOwnerId(() => {})
         * 然后在 controller 的 各种 render 调用时包装一下，就能打上 ownerId
         * hijack 的时候使用 ownerId 而不是 cnode Id
         *
         */
        if (cnode.scopeId) {
          vnode.data = {
            ...vnode.data || {},
            scopeId: cnode.id
          }
        }
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
