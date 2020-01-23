import { createElement, updateElement } from './dom'
import initialDigest from './initialDigest'
import updateDigest from './updateDigest'
import { partialRight } from '../util'
import { isComponentVnode as defaultIsComponentVnode} from '../common'

function defaultDigestObjectLike(obj) {
  // 默认是不要了
  return undefined
}

/**
 * 用来消费 painter 所产生的 diff 数据。要求 cnode 的结构：
 * {
 *   patch: 这次和上次 render 结果的对比
 * }
 *
 * 接受的参数：
 * invoke : 用来真实调用 dom 上 listener 的函数。
 * rootElement: 根节点。
 */
export default function createDOMView({ invoke, receiveRef }, rootDomElement, isComponentVnode = defaultIsComponentVnode, digestObjectLike = defaultDigestObjectLike) {
  const refToVnode = new Map()
  const view = {
    // CAUTION svg not support yet
    createElement: (vnode )=> {
      const element = createElement(vnode, false, invoke)
      if (vnode.ref) {
        refToVnode.set(element, vnode)
      }
      return element
    },
    updateElement: partialRight(updateElement, invoke),
    createFragment() {
      return document.createDocumentFragment()
    },
    createPlaceholder: (info) => {
      return document.createComment(info)
    },
    isComponentVnode,
    digestObjectLike,
    didMount: () => {
      // Mount 完了以后才真正的通知外部的 Observer
      refToVnode.forEach((vnode, ref) => receiveRef(ref, vnode))
      refToVnode.clear()
    },
    getRoot: () => rootDomElement,
  }

  return {
    initialDigest: cnode => initialDigest(cnode, view),
    updateDigest: cnode => updateDigest(cnode, view),
    // TODO trigger 接口，用来触发自定义事件，例如 userSeeUpdate。
  }
}
