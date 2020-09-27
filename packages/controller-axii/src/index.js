/**
 *
 */


/**
 * 记住, view/painter/scheduler 是三个独立的基础部分，他们实现了各自的功能，
 * 并且允许外部通过接口获取内部的信息。
 *
 * view: 渲染 dom，提供统一的事件回调接口
 * painter: 执行 cnode 的 initialize 和 update
 * scheduler: 调用 painter 进行工作
 *
 * controller 在这里与三个基础部分都有关系。并且同时通过插入接口来控制它们的内部。
 * 又通过 receive 来控制它们的 api。看起来有点奇怪，但只要把 controller 想成一个为了
 * 开发者方便而设计胶水层概念就可以了。
 */
import createScheduler from '@ariesate/are/createScheduler'
import createPainter from '@ariesate/are/createPainter'
import createDOMView from '@ariesate/are/DOMView/createDOMView'
import createAxiiController from './controller'
import { observeComputation, getIndepTree } from "./reactive";
import {createObjectIdContainer, tryToRaw} from "./util";
import {cachedTriggerSources} from "./reactive/effect";

export { default as createPortal } from '@ariesate/are/createPortal'
export { default as Fragment } from '@ariesate/are/Fragment'
export { default as VNode } from '@ariesate/are/VNode'
export { default as createElement,  cloneElement, normalizeLeaf, shallowCloneElement } from './createElement'
export { default as vnodeComputed } from './vnodeComputed'
export * from './reactive'
export { default as propTypes } from './propTypes'
export { default as useImperativeHandle } from './useImperativeHandle'
export { default as createRef } from './createRef'
// TODO 和 createRef 区别？
export { default as useRef } from './useRef'
export { default as watch } from './watch'
export { StyleEnum, StyleRule } from './StyleManager'
export { default as createFlatChildrenProxy } from './createFlatChildrenProxy'
export { isComponentVnode } from './controller'
export { createSmartProp } from './controller/ComponentNode'
export { invariant, tryToRaw, shallowEqual } from './util'
export { default as createComponent} from './component/createComponent'
export { flattenChildren } from './component/utils'
export { default as Scenario, createRange, matrixMatch } from './Scenario'
export { default as useContext } from './useContext'
export { default as batchOperation } from './batchOperation'


export function render(vnode, domElement, ...controllerArgv) {
  const controller = createAxiiController(domElement, ...controllerArgv)

  const view = createDOMView(controller.viewInterfaces, domElement, controller.interceptViewActions)
  const painter = createPainter(
    controller.painterInterfaces.renderer,
    controller.painterInterfaces.isComponentVnode,
    controller.painterInterfaces.ComponentNode,
    controller.painterInterfaces.diffNodeDetail,
    controller.painterInterfaces.normalizeLeaf,
  )

  const scheduler = createScheduler(painter, view, controller.schedulerInterfaces)

  // 这里这么写只是因为我们的 controller 里同时可以控制 repaint
  controller.receiveScheduler(scheduler)
  controller.paint(vnode)

  return controller
}

// 目前是个 devtools 用的


/**
 * 通信机制
 * 1. panel 调用 window.AXII_HELPERS.observe。开启监听。
 * 2. 监听开始后，只要进行了 compute，就会计算 indepTree，panel 通过调用 window.AXII_HELPERS.flashCurrentIndepTree 获取
 * 获取一次之后，该变量就会重置回 null。除非再有 compute 进行计算。
 * 3. panel 可以调用 unobserve 取消监听。
 */

const getIndepId = createObjectIdContainer()

window.AXII_HELPERS = {
  computation: null,
  observe(keepRef) {
    const base = window.AXII_HELPERS
    if (base.unobserve) return

    let indepTree = null

    const unobserveComputation = observeComputation({
      compute(computation, appliedComputations, cachedTriggerSources) {
        indepTree = {
          object: tryToRaw(computation.computed),
          name: computation.displayName || computation.name,
          indeps: getIndepTree(computation, (indepInfo) => {
            // 增加 id，因为会有环，多个依赖的源头可能是同一个。用 id 能更快判断
            if (!indepInfo.id) indepInfo.id = getIndepId(indepInfo.object)

            // TODO source name 怎么处理还没设计好
            indepInfo.name = indepInfo.computation ?
              (indepInfo.computation.displayName || indepInfo.computation.name) :
              indepInfo.id

            // 增加脏标记
            if (indepInfo.computation && appliedComputations.has(indepInfo.computation)) {
              indepInfo.changed = true
            } else {
              indepInfo.changed = cachedTriggerSources.has(indepInfo.indep)
            }

            // TODO 删除的操作应该也改到这里执行，这样就不用传 keepRef 了
          }, keepRef)
        }
      },
      end() {
        // end 的时候就清空了。
        // devtool 时 setTimeout 来拿的，所以实际上只有在页面 debug 的时候可以拿到 indepTree。
        indepTree = null
      }
    })

    base.flashCurrentIndepTree = () => {
      const result = indepTree
      indepTree = null
      return result
    }

    base.unobserve = () => {
      unobserveComputation()
      indepTree = null
      delete base.unobserve
    }

    console.log("observe start")
  },
  inspect(path) {
    // TODO devtools 只能传 path 过来
  },
  debug(path) {
    // TODO devtools 只能传 path 过来
  }
}


