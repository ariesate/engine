import { cloneElement } from '@ariesate/are/createElement'
import propTypes from './propTypes'
import { walkVnodes, isComponentVnode, reverseWalkCnodes } from './common'
import { invariant, mapValues, replaceItem } from './util'
import {
  isReactiveLike,
  isRef,
  createComputed,
  destroyComputed,
} from './reactive';
import { getMutationRunner } from './derive'
import { getDisplayValue, isDraft } from './draft'
import { ComputedVnode } from './vnodeComputed'

function watch(computation, callback) {
  let result
  let isFirstRun = true
  const token = createComputed(() => {
    if (isFirstRun) {
      result = computation()
      isFirstRun = false
    } else {
      callback()
    }
  })
  return [result, token]
}

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

function createVirtualCnodeForComputedVnode(computedVnode) {
  const type = (changeCallback, saveWatchToken) => {
    const [vnode, watchToken] = watch(computedVnode.computation, changeCallback)
    saveWatchToken(watchToken)
    return vnode
  }
  type.isVirtual = true
  return {
    type
  }
}

function createVirtualCnodeForReactiveText(reactiveVnode) {
  const type = (changeCallback, saveWatchToken) => {
    // 只有可能是 refComputed。
    const toDisplay = isDraft(reactiveVnode) ? getDisplayValue(reactiveVnode) : reactiveVnode
    const [value, watchToken] = watch(() => toDisplay.value, changeCallback)
    saveWatchToken(watchToken)
    return value
  }

  type.isVirtual = true

  return {
    type,
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

function replaceReactiveWithVirtualCnode(result) {
  walkVnodes([result], (vnode, currentPath, parentCollection) => {
    if (!vnode) return
    // 碰到 component vnode 也中断掉。组件是不会重新 render 的。
    if (isComponentVnode(vnode)) return

    if (vnode instanceof ComputedVnode) {
      replaceItem(parentCollection, vnode, createVirtualCnodeForComputedVnode(vnode))
    } else if (hasRefProps(vnode)) {
      replaceItem(parentCollection, vnode, createVirtualCnodeForReactiveProps(vnode))
    } else if (isRef(vnode)) {
      replaceItem(parentCollection, vnode, createVirtualCnodeForReactiveText(vnode))
    }

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

export default function createAxiiController() {
  let scheduler = null
  let ctree = null

  return {
    renderer: {
      rootRender(cnode) {
        return cnode.type.render(cnode.props)
      },
      initialRender(cnodeToInitialize, parent) {
        let result
        // 1. virtualCnode，这是在正常 cnode render 过程中动态分析返回结果创造出来的
        if (cnodeToInitialize.type.isVirtual) {
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
          cnodeToInitialize.unmount = () => {
            cnodeToInitialize.state && Object.values(cnodeToInitialize.state).forEach(state => destroyComputed(state))
            Object.values(cnodeToInitialize.localProps).forEach(prop => destroyComputed(prop))
          }

          const { props, localProps } = cnodeToInitialize
          const { propTypes: thisPropTypes } = cnodeToInitialize.type

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

              const mutationRunner = getMutationRunner(cnodeToInitialize, mutateFn)
              const shouldStopApply = mutationRunner((nextProps) => {
                // 显式 return false 表示要 stopApply
                return listener ? listener(nextProps, mergedProps) === false : false
              })
              if (shouldStopApply) activeEvent.preventCurrentEventDefault()
            } : mergedProps[propName]

          ) : mergedProps

          currentRenderingNode = cnodeToInitialize
          result = cnodeToInitialize.type(injectedProps)
          currentRenderingNode = null
          replaceReactiveWithVirtualCnode(result)

        }
        return result
      },
      updateRender(virtualCnodeToUpdate) {
        // 只有 virtualCnode 会 collectChange，所以只有它会重新 render。
        // 在 filterNext 中也只处理新建和删除的节点。update 的节点是不处理的，也就以为这节点不可能因为渲染时 prop 的变化而更新。

        // 之前的 watch 全部清除掉，每次更新都重新订阅。
        const result = virtualCnodeToUpdate.virtualRender()
        replaceReactiveWithVirtualCnode(result)
        return result
      },
    },
    supervisor: {
      filterNext(result) {
        const { toInitialize, toDestroy = {} } = result

        reverseWalkCnodes(Object.values(toDestroy), cnode => {
          cnode.unmount && cnode.unmount()
        })
        // 是否仍然保持 通过 props 更新的能力？
        // 这种情况只存在于 vnodeComputed 中，变成 vnodeComputed 中是否允许
        // 改变产生的 vnode 的 props？如果允许，那么 vnodeComputed 中可以再动态生成 computed。
        // 如果不允许，那么就是不允许 动态改变 props 的绑定数据，不允许动态创建 computed，不允许动态创建 props。
        // 不允许，如果需要动态创建，应该生成新组件，用 derive。
        // vnodeComputed 只适用于不创建、不修改绑定的情况。
        // TODO 需要检测是否有用户用错了的。
        return { toPaint: toInitialize, toDispose: toDestroy }
      },
      unit: (sessionName, unitName, cnode, startUnit) => {
        return startUnit()
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
      }
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
