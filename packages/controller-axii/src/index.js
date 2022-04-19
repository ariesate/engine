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
import {invariant, tryToRaw} from "./util";
import implementDevToolInterface from './devToolInterface'
import { version } from '../package.json'

export { default as createPortal } from '@ariesate/are/createPortal'
export { default as Fragment } from '@ariesate/are/Fragment'
export { default as VNode } from '@ariesate/are/VNode'
export { default as createElement,  cloneElement, normalizeLeaf, shallowCloneElement } from './createElement'
export { default as vnodeComputed, isVnodeComputed } from './vnodeComputed'
export * from './reactive'
export { default as propTypes } from './propTypes'
export { default as useImperativeHandle } from './useImperativeHandle'
export { default as createRef } from './createRef'
// TODO 和 createRef 区别？
export { default as useRef } from './useRef'
export { default as watch, traverse, watchReactive, watchOnce, autorun } from './watch'
export { StyleEnum, StyleRule } from './StyleManager'
export { isComponentVnode, useViewEffect, useContext, createContext } from './controller'
export { createSmartProp, overwrite, disableDraft, DIRTY } from './controller/ComponentNode'
export { invariant, tryToRaw, shallowEqual, createBufferedRef, deferred, composeRef } from './util'
export { default as createComponent} from './component/createComponent'
export { default as Scenario, createRange, matrixMatch, addAlpha } from './Scenario'
export { default as batchOperation } from './batchOperation'
export * from './draft'
export { version } from '../package.json'

export function render(vnode, domElement, ...controllerArgv) {
  domElement.innerHTML = ''
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

// conflict detection.
invariant(window.AXII_VERSION === undefined, `multiple axii detected, current version ${version}`)
window.AXII_VERSION = version

// TODO 根据 _DEV_ 变量判断
implementDevToolInterface()
