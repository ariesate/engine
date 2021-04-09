import {createElement, updateElement} from './dom'
import initialDigest from './initialDigest'
import updateDigest from './updateDigest'
import {invariant, warn} from '../util'
import {isComponentVnode as defaultIsComponentVnode} from '../common'
import { shallowCloneElement as defaultShallowCloneElement } from "../createElement"

function defaultDigestObjectLike(obj) {
	warn(false, `found object vnode, you should handle your self ${JSON.stringify(obj)}`)
	// 默认是不要了
	return undefined
}

/**
 * createDOMView
 * 用来消费 painter 所产生的 diff 数据。要求 cnode 的结构：
 * {
 *   patch: 这次和上次 render 结果的对比
 * }
 *
 * 接受的参数：
 * invoke : 用来真实调用 dom 上 listener 的函数。
 * receiveDom: 获取真实的节点 ref。
 * rootElement: 根节点。
 *
 * 所有的劫持都通过 inject 来做。
 *
 * createDOMView 的参数设计：
 * 1. 对于 view 的 actions：createElement/updateElement/createFragment/createPlaceholder，应该提供劫持操作。
 * 2. 对于 invoke/receiveElement/isComponentVnode/digestObjectLike，这些是和外部的接口。
 *
 */
export default function createDOMView(
	{
		invoke,
		isComponentVnode = defaultIsComponentVnode,
		digestObjectLike = defaultDigestObjectLike,
		shallowCloneElement = defaultShallowCloneElement
	},
  rootDomElement,
  intercept = x => x) {

	const actionUtils = intercept({
		// CAUTION 关于劫持的约定：可以劫持第一参数，这决定这最终创建什么样的真实 dom。但不要动最后一个参数 patchNode。
		// 这是真正在内存中表示当前节点的对象。入了引擎，谁都不应该修改。
		// 另外劫持做的事情应该只能翻译一些框架特定的 attr，但不应该修改行为，例如 ref，因此我们的 ref 都是根据原始的 patchNode 来记录的。
		createElement: (vnodeToCreateElement, cnode) => {
			return createElement(vnodeToCreateElement, invoke)
		},
		// 这里参数尽量和 createElement 保持一致，这样外界可以用同一个 interceptor 来处理
		updateElement: (vnode, cnode) => {
			const patchNode = cnode.view.patchNodesQuickRefById[vnode.id]
			// CAUTION 可能会出现 vnode 因为 cnode 的变化而已经卸载的情况，例如从数组 map 出来的情况。
			if (!patchNode) return null

			updateElement(vnode, patchNode.element, invoke)
			return patchNode.element
		},
		createFragment() {
			return document.createDocumentFragment()
		},
		createPlaceholder: (info) => {
			return document.createComment(info)
		},
	})

	const viewUtil = {
	  ...actionUtils,
		isComponentVnode,
		digestObjectLike,
		shallowCloneElement,
		getRoot: () => rootDomElement,
	}

	// return 出来的对象是给 scheduler 用的。
	return {
		// 注意这里一定要用 viewUtil.updateElement，因为外部可能进行了注入，这里也要保持外部的注入。
		updateElement: viewUtil.updateElement,
		initialDigest: cnode => initialDigest(cnode, viewUtil, shallowCloneElement),
		updateDigest: cnode => updateDigest(cnode, viewUtil, shallowCloneElement),
	}
}
