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
import createVnodeElement, { cloneElement as cloneVnodeElement } from '@ariesate/are/createElement'
import * as CONSTANT from '@ariesate/are/constant'
import createNoviceController from './createNoviceController'

export const createElement = createVnodeElement
export const cloneElement = cloneVnodeElement

export function render(vnode, domElement, ...controllerArgv) {
  const controller = createNoviceController(...controllerArgv)

  const view = createDOMView(controller.observer, domElement)
  const painter = createPainter(controller.renderer)

  // 传进去的background 是因为 background 实现了 transaction 接口。
  const scheduler = createScheduler(painter, view, controller.supervisor)

  // 这里这么写只是因为我们的 controller 里同时可以控制 repaint
  controller.receiveScheduler(scheduler)
  controller.paint(vnode)

  return controller
}

export {
  CONSTANT,
}
