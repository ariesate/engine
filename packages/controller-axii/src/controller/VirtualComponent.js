// CAUTION 为了写得更加便捷，我们允许用户直接写个 function 节点，自动转成 vnodeComputed。
// 这也让我们直接放弃了 render props
import {isReactiveLike, isAtom} from "../reactive";
import {invariant, isComponentVnode, createElement, normalizeLeaf, isVnodeComputed, VNode} from "../index";
import watch, {traverse} from "../watch";
import { walkVnodes } from "../util";

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
 * 我们会将组件渲染中产生 function 节点替换成 component node，这样就能利用引擎的机制来刷新组件了。
 * createVirtualCnodeForComputedVnodeOrText 就是用来创建 virtual Component 的。
 *
 * 1. 但这里有个性能问题，就是 function 节点是在 render 中产生的函数，每次 render 自然都是新引用了。
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
			// CAUTION 一定要从 currentCache 上面读，这样才能保证使用了最新的 reactiveVnode，因为 Component 为了保持引用，如果有 cache，就是用的上一次创建的引用。
			return (typeof currentCache.vnode === 'function') ? currentCache.vnode() : currentCache.vnode.value
		}

		Component.isVirtual = true
		Component.displayName = (typeof currentCache.vnode === 'function') ? (currentCache.vnode.name || currentCache.vnode.displayName) : `(Text)`

		currentCache.Component = Component
	}

	return createElement(Component)
}

const reservedAttrNames = ['key', 'ref']

/**
 * 这个函数是在 render 时被调用的，每次 render 都会销毁上一次里面创建的 computed， 所以这里放心 watch 没有关系。在组件销毁或者更新时，上一次的 watch 会被自动销毁。
 */
export function watchReactiveAttributesVnode(vnode, reportChangedVnode) {
	const reactiveAttributes = Object.entries(vnode.attributes).filter(([attrName, attr]) => {
		return isReactiveLike(attr) && !reservedAttrNames.includes(attrName)
	})

	if (reactiveAttributes.length) {
		watch(() => {
			reactiveAttributes.forEach(([attrName, attr]) => {
				traverse(attr)
			})
		}, () => {
			// CAUTION 只要上报这个 vnode 就够了。engine 会使用这个 vnode 上的 path 去找对应的 patchNode。
			reportChangedVnode(vnode)
		})
	}
}


// function replaceVnodeWith(vnode, matchAndReplace) {
// 	// return vnode
// 	const isArray = Array.isArray(vnode)
// 	const start = isArray ? vnode : [vnode]
// 	walkRawVnodes(start, (vnode, currentPath, parentCollection, context) => {
// 		const [shouldStop, vnodeToReplace, nextContext] = matchAndReplace(vnode, currentPath, context)
// 		if (vnodeToReplace) replaceItem(parentCollection, vnode, vnodeToReplace)
// 		return [shouldStop, nextContext]
// 	})
// 	return isArray ? vnode : start[0]
// }

// TODO 增加 path 信息，修改 proxy 里面的信息。

/**
 * 渲染出来的例子：
 * <div>
 *   {children}   <-- 上层传过来的 children。放在我的作用域里，表示我决定要渲染了，那么应该解开。
 *   <div>{() => children.map(child => child)}</div>  <-- 我进行了处理的，还在我的作用域里，也表示我要渲染，要解开。
 *   <Sub>
 *     <div>xxx</div> <-- 我传给子组件的 children，就跟 props 一样，子组件是渲染、丢弃、再传递给子组件，都和我无关了。
 *     {children} <-- 透传进去的，至于子组件是否决定渲染，我不管了
 *   </Sub>
 * </div>
 *
 * 所以总结一下
 * 1. 只有我决定要渲染的才有解开、替换的必要。其他的都原封不动的丢给子组件去。
 * 2. 所以我收到的 children proxy，解开里面也应该还是 基本类型/函数，没有变成 vnode/vnodeComputed.
 *
 */

export function HandleFunctionAndReactiveAndChildren(renderResult, collectChangePatchNode, cnode) {
	const rootVnode = (renderResult instanceof VNode) ? renderResult : normalizeLeaf(renderResult)

	const container = [rootVnode]

	walkVnodes(container, (walkChildren, vnode, vnodes, vnodeIndex, parentVnode, currentPath) => {
		// CAUTION 可以用 undefined 做 children，这里统一处理
		// 如果是 null 的话，需要下面的 normalize.
		if (vnode === undefined) {
			vnodes[vnodeIndex] = normalizeLeaf(vnode)
			return
		}

		// 1. 这是当前组件的作用域，先解开children。
		const vnodeToHandle = vnode?.isChildren ? vnode.raw : vnode
		// CAUTION 增加标记，可以给外部的搭建系统等使用
		if (vnode?.isChildren && parentVnode?.attributes) {
			parentVnode.attributes.isChildrenContainer = true
		}
		// 只要发现不是原来的节点，不管后面处理还是不处理，先替换一下。确保引用正确。
		// CAUTION 后面还要替换的话都用 vnodes[vnodes.indexOf(vnode)]
		if (vnodeToHandle !== vnode) vnodes[vnodeIndex] = vnodeToHandle

		// 2. 不递归处理 component 节点，直接替换并结束流程
		if(isComponentVnode(vnodeToHandle)) return

		// 2 先检查要不要 normalize，如果需要 normalize，那么替换掉原来的引用，直接递归 children。
		//  因为没有 normalize 的节点只有 string/null/undefined/array，上面没有办法添加 reactive 信息。
		if( !(vnodeToHandle instanceof VNode )) {
			const normalizedVnode = normalizeLeaf(vnodeToHandle)
			if (normalizedVnode instanceof VNode)	{
				vnodes[vnodeIndex] = normalizedVnode
				// 如果 children 整体就是 isChildren，也要解开，不然引用就不正确了
				if (normalizedVnode.children?.isChildren) {
					normalizedVnode.children = normalizedVnode.children.raw
				}
				return normalizedVnode.children && walkChildren(normalizedVnode.children)
			}
		}

		// 3 剩下的节点就全都是 normalized 节点 或者 function 节点了。
		// 3.1 先处理天然 normalized 节点
		if( vnodeToHandle instanceof VNode ) {
			if (hasRefAttributes(vnodeToHandle) || isReactiveLike(vnodeToHandle.attributes?.style)) {
				watchReactiveAttributesVnode(vnodeToHandle, collectChangePatchNode)
			}
			if (vnodeToHandle.children?.isChildren) {
				vnodeToHandle.children = vnodeToHandle.children.raw
			}
			return vnodeToHandle.children && walkChildren(vnodeToHandle.children)
		}

		if (isAtom(vnodeToHandle, true) || typeof vnodeToHandle === 'function'){
			if(!vnodes.indexOf) debugger
			vnodes[vnodeIndex] = createVirtualCnodeForComputedVnodeOrText(vnodeToHandle, cnode, currentPath)
			// 替换成 VC 以后不用管了，他会被当成组件之后处理。
			return
		}

		// 非严格模式，可以检测到传入的静态值伪装成 atom 的节点，这是为了组件在处理的时候都当成 atom 处理，不用特殊判断。
		if (isAtom(vnodeToHandle)) {
			vnodes[vnodeIndex] = normalizeLeaf(vnodeToHandle.value)
			return
		}

		// 如果还有剩下的情况，那就说明出现了非法的节点
		console.warn('unknown vnode', vnode)

	})

	// 有可能自身就被替换了，所以写成这样。
	return container[0]
}



// export function replaceVnodeComputedAndWatchReactive1(renderResult, collectChangePatchNode, cnode) {
// 	// return null 的情况
// 	if (typeof renderResult !== 'object') return renderResult
// 	const currentWorkingCnode = getCurrentWorkingCnode()
// 	invariant(currentWorkingCnode === cnode, 'you can only call watch reactive props from cnode self')
// 	invariant(isCollectingComputed(), 'you are not collecting computed, can not watch reactive prop vnode')
// 	return replaceVnodeWith(renderResult, (vnode, currentPath, isInChildComponent) => {
// 		// 返回的三个参数 [shouldStop, vnodeToReplace]
// 		if (!vnode) return [true]
// 		// 如果不是自己创建的节点是外面传进来的，那么已经在外面组件的 replace 过了
//
// 		// 把自己拿到的 children 直接透传给子组件的情况我们也不管了
// 		if (isInChildComponent && vnode.isChildren) return [true]
//
// 		// 一旦碰到 component vnode 就要中断掉。里面的 replace 要交给这个组件 render 的时候自己处理。
// 		// 如果碰到 component 节点，标记一下 context 为 isInChildComponent。仍然继续出来。
// 		if (isComponentVnode(vnode)) {
// 			return [false, undefined, true]
// 		}
//
// 		// TODO 碰到 isChildren，并且不在子组件里，那么要解开！！！，当成自己的元素一起处理了。！！！
// 		const vnodeToReplace = (!isInChildComponent && vnode.isChildren) ? normalizeLeaf(vnode.raw) : vnode
// 		// 到这里，我们管的是：
// 		// 1. 自己创建的节点，包括传到子组件里面去的 children。
// 		// 2. 自己决定于渲染了的（子组件之外的）父组件传过来的 children。
//
// 		// 替换为 virtual cnode 之后也要停止 walk，让 virtual cnode render 的时候再处理里面的。
// 		// CAUTION 普通的 dom 元素 attribute 除了 style 意外全部都只能接受 "number|string"，所以只能是 ref。只有 style 单独考虑了一下。
// 		if (hasRefAttributes(vnodeToReplace) || isReactiveLike(vnodeToReplace.attributes?.style)) {
// 			watchReactiveAttributesVnode(vnodeToReplace, currentPath, collectChangePatchNode, cnode)
// 			return [false, vnodeToReplace]
// 		} else if (isAtom(vnodeToReplace) || (typeof vnodeToReplace === 'function') ) {
//
// 			// 如果还是在自己的作用域内，不管这个节点是自己创建的还是 parent 传进来的 children。
// 			// 都要创建 VirtualComponent，这表示当前这个节点的 render 已经决定把它真实渲染出来了。
// 			if (!isInChildComponent) {
// 				// CAUTION 严格模式也是 ref/vnodeComputed 才替换成真的 VirtualComponent。否则是 refLike。直接取 value 就可以了。
// 				const replaceVnode = (isAtom(vnodeToReplace, true) || (typeof vnodeToReplace === 'function')) ?
// 					createVirtualCnodeForComputedVnodeOrText(vnodeToReplace, cnode, currentPath) :
// 					normalizeLeaf(vnodeToReplace.value)
// 				return [true, replaceVnode]
//
// 			} else {
// 				// 如果已经到了子组件内，那么我们只是把我们创建的 function 节点替换成 vnodeComputed
// 				return [true, (typeof vnodeToReplace === 'function') ? vnodeComputed(vnodeToReplace) : undefined]
// 			}
// 		} else {
// 				// TODO !!!!!!!!!!!!!!!!!! normalize 想清楚，究竟什么时候做！！！！！！还要考虑 diff 的问题！！！！
// 				//  如果这里做，那么 外面也要改，replace 出去的 node 有可能还可以继续 Normalize!!!!
// 				// 外面的 normalizeLeaf 也要改成默认不递归的！！！！
// 		}
//
// 		return [false, vnode !== vnodeToReplace ? vnodeToReplace : undefined]
// 	})
// }

function hasRefAttributes(vnode) {
	return vnode.attributes && Object.values(vnode.attributes).some(attr => isAtom(attr))
}

