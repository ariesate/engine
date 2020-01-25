import createElement, { cloneElement, normalizeLeaf } from '@ariesate/are/createElement'
import Fragment from '@ariesate/are/Fragment'
import VNode from '@ariesate/are/VNode';
import propTypes from '@ariesate/are/propTypes'
import { walkVnodes, isComponentVnode } from './common'
import { invariant, mapValues, replaceItem } from './util'
import {
  isReactive, isReactiveLike,
  isRef,
  subscribe, toRaw,
} from './reactive';
import { getMutationRunner } from './derive'
import { getDisplayValue, isDraft } from './draft';


// TODO 发现了一个 diff bug， 当刚好 {array} 中新增的一项和后面的节点相同的时候，dom 就不变化了。


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

function createVirtualCnode(reactiveVnode) {
  const type = (changeCallback) => {
    // 只有可能是 arrayComputed/refComputed。
    // 当是 refComputed 时，可能是 string/null/undefined/vnode。

    const toDisplay = isDraft(reactiveVnode) ? getDisplayValue(reactiveVnode) : reactiveVnode
    const result =  isRef(toDisplay) ? toDisplay.value : toDisplay
    subscribe(toDisplay, changeCallback)
    return normalizeLeaf(result)
  }

  type.isVirtual = true

  return {
    type,
  }
}


function createVirtualCnodeFromRefProps(vnodeWithRefProps) {
  const type = (changeCallback) => {
    const unwrappedProps = {}
    const formVnode = isFormVnode(vnodeWithRefProps)
    Object.entries(vnodeWithRefProps.props).forEach(([name, prop]) => {
      // 普通属性
      if (!isReactiveLike(prop)) return unwrappedProps[name] = prop

      invariant(isRef(prop), `should not have non-ref reactive prop on dom attribute: ${name}`)
      const propToDisplay = isDraft(prop) ? getDisplayValue(prop) : prop
      unwrappedProps[name] = propToDisplay.value
      if (formVnode && name === 'value') {
        const originRef = unwrappedProps.ref
        unwrappedProps.ref = (e) => {
          formElementToReactive.set(e, propToDisplay)
          originRef && originRef(e)
        }
      }

      subscribe(propToDisplay, changeCallback)
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
    // 碰到 component vnode 要中断掉。
    invariant(vnode, 'invalid vnode found')
    if (isComponentVnode(vnode)) return
    // reactive array 也要
    const isReactiveVnode = isReactiveLike(vnode.raw ? vnode.raw : vnode)
    // if (isReactiveVnode) console.log(vnode)
    const vnodeHasRefProps = hasRefProps(vnode)
    if (isReactiveVnode || vnodeHasRefProps) {
      // 2. 如果是 reactive expression。替换成 virtualCnode。
      const virtualCnode = isReactiveVnode ? createVirtualCnode(vnode.raw ? vnode.raw : vnode) : createVirtualCnodeFromRefProps(vnode)
      replaceItem(parentCollection, vnode, virtualCnode)
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

  // TODO 貌似目前没用, 当前 controlled component 是强行在每次 change 后来同步 target.value 和 reactive.value 实现的。
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
        // virtualCnode，这是在正常 cnode render 过程中动态分析返回结果创造出来的
        if (cnodeToInitialize.type.isVirtual) {
          // 建立 watch 关系，这里把这个函数引用单独声明出来，这样即使 type 中 subscribe 执行多次，由于用的是 set，也不会多次执行回调。
          cnodeToInitialize.changeCallback = (isUnchanged) => {
            // 可能会受到 isUnchanged === true 的消息
            !isUnchanged && scheduler.collectChangedCnodes([cnodeToInitialize])
          }
          result = cnodeToInitialize.type(cnodeToInitialize.changeCallback)
        } else {

          // TODO ？refComputed/arrayComputed 产生 vnode.props 是个 proxy
          // 对于没有的 props 要补全 defaultProps
          cnodeToInitialize.props = isReactiveLike(cnodeToInitialize.props) ? toRaw(cnodeToInitialize.props) : cnodeToInitialize.props
          Object.entries(cnodeToInitialize.type.propTypes || {}).forEach(([propName, propType]) => {
            if (!(propName in cnodeToInitialize.props)) {
              cnodeToInitialize.props[propName] = propType.defaultValue
            }
          })

          const { props } = cnodeToInitialize

          // 开始对其中的 mutation回调 prop 进行注入。
          const injectedProps = cnodeToInitialize.type.propTypes ? mapValues(cnodeToInitialize.type.propTypes, (propType, propName) => {
            if (propType.is(propTypes.func)) {
              return (mutateFn) => {
                const listener = props[propName]

                const mutationRunner = getMutationRunner(cnodeToInitialize, mutateFn)
                const shouldStopApply = mutationRunner((nextProps) => {
                  // 显式 return false 表示要 stopApply
                  return listener ? listener(nextProps, props) === false : false
                })
                if (shouldStopApply) activeEvent.preventCurrentEventDefault()
              }
            }

            return props[propName]

          }) : props
          currentRenderingNode = cnodeToInitialize
          result = cnodeToInitialize.type(injectedProps)
          currentRenderingNode = null
          replaceReactiveWithVirtualCnode(result)

        }
        return result
      },
      updateRender(virtualCnodeToUpdate) {
        // 只有 virtualCnode 会进行 updateRender，这就是精确更新。
        const result = virtualCnodeToUpdate.type(virtualCnodeToUpdate.changeCallback)
        replaceReactiveWithVirtualCnode(result)
        return result
      },
    },
    supervisor: {
      filterNext(result) {
        const { toInitialize, toDestroy = {} } = result
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
         // TODO 这里的 ref 和 cnode 中的 type 耦合了，代码不够干净。
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

export function onUnmount() {

}