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


// TODO 应该还要个获取 source scope 的 helper。
// TODO 重新设计一下！！！！和 panel script 的通信。
window.AXII_HELPERS = {
  computation: null,
  observeComputation,
  // 只能获取当前的。
  getCurrentIndepTree: () => {
    console.log("calling from devtools", window.AXII_HELPERS.computation)
    // TODO 还要把脏的都计算出来。
    return window.AXII_HELPERS.computation && getIndepTree(window.AXII_HELPERS.computation)
  },
  inspect(path) {
    // TODO devtools 只能传 path 过来
  },
  debug(path) {
    // TODO devtools 只能传 path 过来
  }
}

// TODO 还可以增加每个 computation 都 debug。
observeComputation({
  compute(computation) {
    window.AXII_HELPERS.computation = computation
  },
  end() {
    window.AXII_HELPERS.computation = null
    console.log("computing")
  }
})

