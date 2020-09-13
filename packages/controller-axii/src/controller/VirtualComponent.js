// CAUTION 为了写得更加便捷，我们允许用户直接写个 function 节点，自动转成 vnodeComputed。
// 这也让我们直接放弃了 render props
import {isReactiveLike, isRef} from "../reactive";
import {invariant, isComponentVnode, createElement} from "../index";
import watch, {traverse} from "../watch";
import {walkRawVnodes} from "../common";
import { getCurrentWorkingCnode } from '../renderContext'
import { isCollectingComputed } from "../reactive/effect";
import { replaceItem} from "../util";
import { composeRef } from "./index";

const virtualComponentCacheByCnode = new WeakMap()
function getTypeCache(cnode, currentPath) {
	let allCacheOfCnode = virtualComponentCacheByCnode.get(cnode)
	if (!allCacheOfCnode) virtualComponentCacheByCnode.set(cnode, (allCacheOfCnode = {}))
	const currentPathStr = currentPath.join('.')
	let currentCache = allCacheOfCnode[currentPathStr]
	if (!currentCache) allCacheOfCnode[currentPathStr] = (currentCache = {})
	return currentCache
}

/**
 * 我们会将组件渲染中产生 vnodeComputed 节点替换成 component node，这样就能利用引擎的机制来刷新组件了。
 * createVirtualCnodeForComputedVnodeOrText 就是用来创建 virtual Component 的。
 *
 * 1. 但这里有个性能问题，就是 vnodeComputed 是在 render 中产生的函数，每次 render 自然都是新引用了。
 * 那么正常的 diff 过程会把这个虚拟节点都当成全新的，这就导致 vnodeComputed 里面本来无法继续利用 diff 了。
 *
 * 解决方案是按照 cnode 和 vnodeComputed 的路径把建立的 Virtual Component 存起来。始终保持同一个类型引用。
 * 使用的 cache 结构： 第一层是 cnode，第二层是 path string，叶子节点是 { Component, vnode }。vnode 即最新的 vnodeComputed。
 * Component 始终使用一个，vnode 会动态变化，type 渲染时根据 path 去动态取最新的 vnode。
 *
 * 这里的 reactiveVnode 是个函数。里面应该有 reactive 对象，期望每次里面的对象变化时，函数所代表的这部分节点就更新。
 *
 * 2. 第二个问题是组件本身的问题：组件和外部传进来的 children 是 vnodeComputed 的问题。例如
 * tabs 这种组件，就可以接受上层传过来的 children，并且很可能这些 children 是根据数据动态生成的。
 * 而 tabs 在构建自身时，会去读 Props.children 上的类如标题等信息。
 * CAUTION 这就要求系统在 createElement 时发现了函数节点，就"一定"要立即执行创建 vnodeComputed，这样子组件才会拿到正确的children。
 * 不能再这里执行，应为我们的递归检测到 Component 时就不处理了，剩下的让子组件去处理。
 *
 */
export function createVirtualCnodeForComputedVnodeOrText(reactiveVnode, cnode, currentPath) {
	// CAUTION 拿到 originVnode 的时候如果是 function，一定要立即包装成 vnodeComputed 得到结果，这样作为 children 传给子组件之后才能被子组件理解使用。
	const currentCache = getTypeCache(cnode, currentPath)
	currentCache.vnode = reactiveVnode
	let { Component } = currentCache
	if (!Component) {
		Component = function VirtualComponent() {
			return currentCache.vnode
		}

		Component.isVirtual = true
		// 标记一下，因为内部结构可能变化，这个变化是无法判断的，所以永远要 rerender。
		Component.shouldComponentUpdate = () => true
		Component.displayName = reactiveVnode.displayName || `VnodeComputed`

		currentCache.Component = Component
	}

	return createElement(Component)
}

/**
 * 这个函数是在 render 时被调用的，所以直接在里面创建 watch 没有关系，在组件销毁或者更新时，上一次的 watch 会被自动销毁。
 */
export function watchReactiveAttributesVnode(vnode, reportChangedPatchNode) {
	let patchNode

	const reactiveAttributes = Object.values(vnode.attributes).filter(attr => isReactiveLike(attr))
	if (reactiveAttributes.length) {
		watch(() => reactiveAttributes.forEach(attr => traverse(attr)), () => {
			invariant(patchNode, 'vnode have not been attached, something wrong')
			reportChangedPatchNode(patchNode)
		})
	}

	vnode.ref = composeRef(vnode.ref, (el, p) => {
		patchNode = p
	})
}


function replaceVnodeWith(vnode, matchAndReplace) {
	// return vnode
	const isArray = Array.isArray(vnode)
	const start = isArray ? vnode : [vnode]
	walkRawVnodes(start, (vnode, currentPath, parentCollection) => {
		const [shouldStop, vnodeToReplace] = matchAndReplace(vnode, currentPath)
		if (vnodeToReplace) replaceItem(parentCollection, vnode, vnodeToReplace)
		return shouldStop
	})
	return isArray ? vnode : start[0]
}



export function replaceVnodeComputedAndWatchReactive(renderResult, collectChangePatchNode, cnode) {
	if (typeof renderResult !== 'object') return renderResult

	const [currentWorkingCnode] = getCurrentWorkingCnode()
	invariant(currentWorkingCnode === cnode, 'you can only call watch reactive props from cnode self')
	if (!isCollectingComputed()) debugger
	invariant(isCollectingComputed(), 'you are not collecting computed, can not watch reactive prop vnode')
	return replaceVnodeWith(renderResult, (vnode, currentPath) => {
		// 返回的三个参数 [shouldStop, vnodeToReplace]
		if (!vnode) return [true]
		// 一旦碰到 component vnode 就要中断掉。里面的 replace 要交给这个组件 render 的时候自己处理。
		if (isComponentVnode(vnode)) return [true]
		// 替换为 virtual cnode 之后也要停止 walk，让 virtual cnode render 的时候再处理里面的。
		if (hasRefAttributes(vnode)) {
			watchReactiveAttributesVnode(vnode, collectChangePatchNode, cnode)
			return [false]
		} else if (isRef(vnode) || typeof vnode === 'function') {
			return [true, createVirtualCnodeForComputedVnodeOrText(vnode, cnode, currentPath)]
		}

		return [false]
	})
}



function hasRefAttributes(vnode) {
	return vnode.attributes && Object.values(vnode.attributes).some(attr => isRef(attr))
}

