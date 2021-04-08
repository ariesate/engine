/**
 * CAUTION
 * axii 的渲染过程实际上是建立 reactive 数据与组件实例之间联系的过程，而不是一个动态的计算过程。
 * 具体表现在组件只会因为依赖的 reactive 数据变化而重新 render，父组件的变化是不会让子组件重新 render 的。
 * 所以不要在 vnodeComputed 里面或者任何组件里去改变传给子组件的数据的引用，包括传给子组件的 children 的结构。
 *
 * axii 中 reactive 的内存模型：
 * reactive/ref 的持有者：
 * 1. 组件体系外的作用域。
 * 2. 组件的主体函数创建的，函数作用域。
 * 3. axii 为组件创建的 defaultProps，最后会挂载到 cnode.localProps 上。axii 持有。
 *
 * computed 的持有者：
 * 1. 函数主体创建，函数作用域持有(如果 indep 的生命周期超出当前函数，需要主动销毁)
 * 2. vnodeComputed，函数作用域持有(同上)
 *
 * computed 回收:
 * 1. 如果是 computed 中再创造出来的 computed。例如 createComponent 中 fragment 下再嵌套 fragment 就是这种情况。
 * 父 computed 再变化时，会自动回收上一次的。
 *
 * 2. 如果是 render 过程中创建的 computed，也不需要需要组件自己回收。因为 computed props 或者 vnode 所在的节点会被替换
 * 成 virtual cnode。由 virtual cnode 回收即可。
 *
 *
 * cnode 和 virtual cnode 在生命周期上的区别
 * initialRender: 两者都正常，都需要对结果再进行 reactive 替换成 virtual cnode。每次只替换一层。
 * updateRender: cnode 是父亲传递的 props 引用发生了变化时才会 update。父亲一定重新 render 了。
 *              virtual cnode 是自身 watch 触发的回调。父亲一定没有重新 render，否则自己就被卸载了。
 * unmount: cnode 一定是父亲重新 render 导致自己 unmount。handlePaintResult 中的 toDestroy 一定是 cnode。
 *          virtual cnode unmount 一定是父亲也销毁了。handlePaintResult 中的 toDestroy 一定不是 virtual cnode。
 *
 * 更新时机详细说明：
 * 正常的 Component：不会主动更新，除非父亲来更新，并且传过来的 props 引用有不同。
 * Component 的父亲如果也是 Component，那父亲也不会更新，自己当然也不会更新。
 * 所以只有当父亲是 Virtual Component 时，即 vnodeComputed 节点时，才会出现 vnodeComputed 重新计算，
 * "可能" 创建了全新的 Props 引用，来更新 Component。
 *
 * Virtual Component：即 vnodeComputed 创造的节点，当自己内 computation 的依赖发生变化时，自己就要更新，这是主动更新。
 * 当父节点发生更新时，自己也要更新。父节点可能是 vnodeComputed 也可能是普通 Component。
 *
 * TODO 我们需要引擎提供的能力：
 * 1. 普通 Component 的更新，需要 diff 机制
 * 2. 任何节点的局部更新，
 * 2.1 即需要单点更新：适用于props 为 reactive 的节点。
 * 2.2 也需要能递归 diff 的能力，适用于有 vnodeComponent 创建的节点。
 *
 *
 *
 *
 */

import Fragment from '@ariesate/are/Fragment'
import { UNIT_PAINT } from '@ariesate/are/constant'
import { shallowCloneElement } from '../index.js'
import { reverseWalkCnodes } from '../common'
import { filter, mapValues, shallowEqual, nextTask } from '../util'
import {
	isRef,
} from '../reactive';
import {withCurrentWorkingCnode, activeEvent} from '../renderContext'
import LayoutManager from '../LayoutManager'
import { afterDigestion } from '../reactive/effect';
import { normalizeLeaf } from '../createElement'
import ComponentNode from './ComponentNode'
import {invariant} from "../index";
import propTypes from "../propTypes";

export { useViewEffect, createContext, useContext } from './ComponentNode'

export const layoutManager = new LayoutManager()

function isFormElement(target) {
	return (target instanceof HTMLInputElement)
		|| (target instanceof HTMLSelectElement)
		|| (target instanceof HTMLTextAreaElement)
}



const formElementToBindingValue = new WeakMap()


// TODO 在处理一下 style 的深度对比
function diffNodeDetail(lastVnode, vnode) {
	if (lastVnode.type === String && lastVnode.value !== vnode.value) {
		return {
			value: vnode.value,
		}
	}

	if (!shallowEqual(lastVnode.attributes, vnode.attributes)) {
		return {
			attributes: vnode.attributes,
		}
	}
}

export function isComponentVnode(vnode) {
	return (typeof vnode.type === 'function') && vnode.type !== String && vnode.type !== Array && vnode.type !== Fragment
}

function defaultShouldComponentUpdate(cnode) {
	/**
	 * repaint 的策略：
	 * repaint 的源头应该都是 vnodeComputed。普通的 component 是不会刷新的，靠的是数据之间的联动。
	 * 起始处收集到的 virtualComponent(vnodeComputed) 一定会重新 render，接下来才会进入到 handleResult。
	 * 在接下来的里面，会遇到 remain 的 Component/VirtualComponent。
	 *
	 * 1. 遇到 Component 的时候，就涉及到要不要判断。判断因素：
	 * 1> props 引用有没有变化。数据引用如果有变化，是肯定要 repaint 的
	 *
	 * 2> 传入的 children 有没有变化。
	 * {() => {
	 *  	fields.map((field) => {
	 *  	  return <Field>{ field.name }</Field>
	 *  	})
	 * }}
	 * TODO children 的情况比较复杂，首先 children 的引用一定是全新的：
	 *  2.1> 传入的 children 没有任何动态的部分(没有局部变量引用、没有动态部分)，全部是确定的静态的，那么实际上不需要更新
	 *  2.2> 传入的 children 整体，或者部分是动态的。这时候也不一定要更新：
	 *    2.2.1> 如果每个动态的部分都是 reactive data 的情况，并且引用也没有变。那么不需要更新。
	 *    2.2.2> 如果有动态的 reactive data 引用变了。那么要更新。
	 *    2.2.3> 如果有动态的 vnodeComputed。？？？其实可能不用，因为如果组件自己 render 过程中没有去读过 children。纯粹只是再继续传递下去，children 不影响我的 render，那么当然就不需要再 repaint 啊。
	 *
	 *
	 * 3> 传入的 function prop 引用没有变化。
	 *  3.1> 如果是 "callback" 类型的 function（只要不是在 render 期间调用的），那么就可以不用 repaint，我们可以做一个 callback delegator，在回调中动态指向正确的函数即可！
	 *  3.2> 如果是在 render 期间调用的，那么就需要 repaint，因为可能改变了 render 的结果。
	 *
	 * 综合上面的所有情况来看，还是要看传入的 prop 到底有没有在 render 执行的过程中"用到"，如果没有被用到，那么就不会影响原来的 render 过程。就不需要重新刷新。
	 *
	 * 梳理后的逻辑：
	 * 1. reactive prop 引用变了，那么需要重新 render。（即使当前组件并没有去读，只是进一步往下传递，也需要，因为最终肯定会被叶子节点读到，它的 reactive 需要建立在正确的 prop 上，如果这种情况还要继续优化，有点太复杂了）
	 * 2. children 中有 reactive，并且相比之前来说"引用"变化了（可能没变，例如 children 是字符串、数字，value 没变，或者是个静态结构，里面完全没有 reactive。）。
	 *   2.1 这里的问题就还是和 reactive prop 一样了。如果自己读了其中的引用，那么当然要重新。
	 *   2.2 如果没读：
	 *     2.2.1 作为render 的结果，渲染了。那么那个节点，所使用的的 引用是过时的，我们能做到动态替换吗？？？暂时很难。因为这还是涉及到如果那个节点也只是读了引用的一部分呢？很难往上溯源去替换。
	 *     2.2.2 直接传递给了下一个组件。对下一个组件来说就相当于"引用"变了，
	 *
	 * 所以目前能做的应该只有：
	 * 1. callback prop 优化
	 * 2. string|null children 对比的优化。
	 * 3. 静态结果的 children 对比(需要深度去读 children了，是否会产生性能损失？暂时没有必要。)
	 *
	 * 2. 遇到 VirtualComponent 的时候，肯定要重新 render，既然是 vnodeComputed 创建出来的，那么肯定读了当前作用于里的数据。既然当前都刷新了，那么自己肯定也要刷新。
	 */
	if (cnode.type.isVirtual) return true

	const {props: {children, ...props}, lastProps: { children: lastChildren, ...lastProps}, type} = cnode

	// 1. 先对比 prop 引用变化，这里对 callback 类型的 prop 进行了优化。callback 会在注入的时候生成一个伪造的函数，每次都动态指向当前的。
	if (Object.keys(props).length !== Object.keys(lastProps).length ) return true
	if (Object.entries(props).some(([propName, propValue]) => {
		// 如果是 callback，那么默认认为是相同的，我们在处理 callback 的时候进行了优化。
		if (type.propTypes && type.propTypes[propName] && type.propTypes[propName].is(propTypes.callback)) return false
		return propValue !== lastProps[propName]
	})) return true

	// 再 先对比 children
	if (Object.keys(children).length !== Object.keys(lastChildren).length ) return true
	if (Object.entries(children).some(([childIndex, child]) => {
		// 针对 string(number 也是 string)|null 等简单结构进行的优化。
		if (child.type === String) return child.value !== lastChildren[childIndex].value
		if (child.type === null) return child.type !== lastChildren[childIndex].type

		return child !== lastChildren[childIndex]
	})) return true

	// 所有校验都通过了，那么就不刷新
	return false
}


function attachRef(element, ref) {
	if (typeof ref === 'function') {
		ref(element)
	} else {
		ref.current = element
	}
}


/***************************************
 * createAxiiController
 *
 ***************************************/





export default function createAxiiController(rootElement) {
	let scheduler = null
	let ctree = null

	// 这里有个优化，由于我们的数据变化不一定来自于用户行为，也可能是 setInterval 之类的。可能出现多个数据变化，
	// 但是影响的 cnode 相同，我们当然不希望 cnode 重复更新，最好在数据都变化玩之后，才开始更新 cnode。
	// 所以，当数据变化调用 collectChangeCnode 时，只是先把要更新的节点收集到 changedCnodes 中
	// afterDigestion 会判断当前数据是不是还在变化中，会在变化完之后才执行回调，并且会自动去重，不用担心回调重复执行。
	// CAUTION 注意在组件 digest 过程中也可能出现再收集 changedCnodes 的情况。那么又会再注册一个 scheduleToRepaint 回调。
	const changedCnodes = []
	// 一定要单独变成一个函数，因为 afterDigestion 中是通过对比函数引用来合并重复的 callback 的。
	function scheduleCnodeToRepaint() {
		// scheduler 判断如果不是在 session 中，那么就会开启一个 updateSession。所以为了性能，controller 对于已知的可以合并的流程
		// 最好主动启用 startUpdateSession。例如下面的事件 invoke 回调，回调中可能会有多个 cnode 变化，这样主动开启后 scheduler 在 paint
		// 阶段会做一些性能优化。
		scheduler.collectChangedCnodes(changedCnodes.splice(0))
	}
	const reportChangedCnode = (cnode) => {
		if (!changedCnodes.includes(cnode)) {
			changedCnodes.push(cnode)
			afterDigestion(scheduleCnodeToRepaint)
		}
	}

	// 处理局部更新的节点
	let changedVnodesIndexedByCnode = new Map()
	function scheduleVnodeToRepaint() {
		let toUpdate = changedVnodesIndexedByCnode
		// 先把 changedVnodesIndexedByCnode 腾出来，因为 update 的过程中可能又会产生新的 patch vnode。
		changedVnodesIndexedByCnode = new Map()
		scheduler.collectChangedVnode(toUpdate)
	}
	// 这里通过 vnode 去 report 就够了。在引擎内部会自己根据 vnode.path 去找相应的 patchNode。我们不用管。
	const reportChangedVnode = (vnode, cnode) => {
		invariant(vnode, 'report undefined patchNode')
		let trackedVnodes = changedVnodesIndexedByCnode.get(cnode)
		if (!trackedVnodes) changedVnodesIndexedByCnode.set(cnode, (trackedVnodes = new Set()))
		if (!trackedVnodes.has(vnode)) {
			trackedVnodes.add(vnode)
			afterDigestion(scheduleVnodeToRepaint)
		}
	}

	const commonInitialRender = (cnode) => {
		/**
		 * 给 cnode 增加基本的能力:
		 * 1. reportChangedCnode: 报告自己的内部的变化，这个其实是 VirtualComponent 用的，正常的组件时不会自己变化的。
		 * 2. reportChangePatchNode: 报告自己的局部变化，这是两种类型的组件都可能用到。patchNode 主要是 attributes/innerText 变化。
		 * 因为不想再伪造 cnode，所以需要局部更新。
		 */

		cnode.reportChange = reportChangedCnode
		cnode.reportChangedVnode = reportChangedVnode
		const result = cnode.render()
		return result
	}

	let sessionSideEffects = null
	// 用来处理 session 中产生的 effect 的
	function deferStartEffectSession(sessionSideEffectsToRun = []) {
		if (sessionSideEffectsToRun.length === 0) return
		nextTask(() => {
			scheduler.startUpdateSession(() => {
				sessionSideEffectsToRun.forEach(effect => effect())
			})
		})
	}

	return {
		/****************
		 * painter interfaces
		 ****************/
		painterInterfaces: {
			renderer: {
				rootRender:commonInitialRender,
				initialRender: commonInitialRender,
				updateRender(cnode) {
					/**
					 * 会进行 updateRender 组件只有两种情况:
					 * 1. virtualCnode。也可以理解成 cnode 中使用 reactive 的片段更新。
					 * 2. cnode props 的引用发生了变化。
					 */
					return cnode.render()
				},
			},
			diffNodeDetail,
			isComponentVnode,
			ComponentNode,
			normalizeLeaf,
		},
		/**********************
		 * scheduler 的接口
		 **********************/
		schedulerInterfaces: {
			handlePaintResult(result, cnode) {
				const { toInitialize, toDestroy = {}, toRemain = {}, newRefs = {}, disposedRefs = {} } = result

				// 处理新节点
				Object.values(toInitialize).forEach(newCnode => {
					if (newCnode.didMount) {
						sessionSideEffects.push(() => {
							newCnode.didMount()
						})
					}
				})

				// 递归通知所有的 cnode 进行 willUnmount，unmount 的时候通常会回收里面创建的 computed。会通知 ref 回收
				reverseWalkCnodes(Object.values(toDestroy), cnode => {
					if (cnode.willUnmount) cnode.willUnmount()

					if (cnode.refs) {
						// 立刻通知回收，没有必要等到下一个 tick，只有挂载需要等到 nextTick，因为要 digest。
						Object.values(cnode.refs).forEach(patchNode => attachRef(null, patchNode.ref))
					}
				})

				// 准备通知所有的 newRefs/disposedRefs 进行接收。
				// CAUTION 不能放到相应的 cnode 的 effects 里面去，因为 ref 的 cnode 不一定会重新挂载之类的。
				// 处理新的 refs
				Object.values(newRefs).forEach(patchNode => {
					sessionSideEffects.unshift(() => {
						attachRef(cnode.view.getElementByPatchNode(patchNode), patchNode.ref)
					})
				})

				// 处理要删除的 refs
				Object.values(disposedRefs).forEach(patchNode => {
					attachRef(null, patchNode.ref)
				})

				const toRepaint = filter(toRemain, (cnode) => {
					// 如果用户有自定义的 update 策略，那么使用用户的。如果没有，用我们的策略。
					return cnode.type.shouldComponentUpdate ?
						cnode.type.shouldComponentUpdate(cnode):
						defaultShouldComponentUpdate(cnode)
				})

				// 通知 willUpdate，可能用户有些清理工作要做
				Object.values(toRepaint).forEach(cnodeToRepaint => {
					if (cnodeToRepaint.willUpdate) cnodeToRepaint.willUpdate()
				})

				return { toPaint: toInitialize, toDispose: toDestroy, toRepaint }
			},

			session: (sessionName, startSession) => {
				// CAUTION 一个 session 不能互相嵌套，所以我们可以放心地收集要处理副作用的节点。
				invariant(sessionSideEffects === null, 'last session effect not cleared, something wrong')
				sessionSideEffects = []
				startSession()
				// 结束 session 之后，再开启一个 effectSession 处理所有的 viewEffect
				// TODO session 结束后，对于新增的 ref，要进行通知。对于取消挂载的，也要进行 ref 通知。

				deferStartEffectSession(sessionSideEffects.slice())
				sessionSideEffects = null
			},
			unit: (sessionName, unitName, cnode, startUnit) => {
				// willMount 直接在这里就处理了，到 session 结束时 digest 都完了，再处理就没意义了。
				if (unitName === UNIT_PAINT) cnode.willMount && cnode.willMount()
				// 记录一下，其他功能要用
				return withCurrentWorkingCnode(cnode, startUnit)
			},
		},
		/*********************
		 * 以下是 view 相关的接口
		 **********************/
		viewInterfaces: {
			// 调用 listener。
			invoke: (fn, e) => {
				// CAUTION removeChild 会触发 onBlur 事件，这不是我们想要的情况。
				// 这里两个判断都要，后面按个是兼容 Portal。
				if (!rootElement.contains(e.target) && !document.body.contains(e.target)) {
					console.warn('element is remove, should not call callbacks', e)
					return false
				}

				scheduler.startUpdateSession(() => {
					activeEvent.withEvent(e, () => {
						fn(e)
						if( isFormElement(e.target) ) {
							// 1. 找到相应的 value 上的 reactive value。
							const bindingValue = formElementToBindingValue.get(e.target)
							// 2. 始终保持和 reactive value 一致。
							if (bindingValue !== undefined) {
								// 即可以绑定 ref 也可以绑定一个固定的值。
								e.target.value = isRef(bindingValue) ? bindingValue.value : bindingValue
							}
						}
					})
				})
			},
			isComponentVnode,
		},
		interceptViewActions({ createElement, updateElement, ...rest}) {
			// 2. 劫持 createElement/updateElement 支持 ref 形式的 props、layoutAttributes 变 style。
			const createShallowNode = (vnodeOrPatch, ...rest) => {
				// shallowClone 一下是为了和原来的 vnodeOrPatch 断开链接，不要改了原来的对象。
				return [shallowCloneElement(vnodeOrPatch), ...rest]
			}
			const composedCreateElement = composeInterceptors(createShallowNode, [translateRefAttributes, attachLayoutStyle, attachScopeId], createElement)
			const composedUpdateElement = composeInterceptors(createShallowNode, [translateRefAttributes, attachLayoutStyle], updateElement)
			return {
				// vnode 是用户 render return 出来的, patchNode 是根据 vnode clone 出来的, patchNode 上面会有真正的 element 引用。
				// 我们不能直接把 vnode 和 patchNode 做引用关系，因为 patchNode 在 engine 可能会为了防止误操作多次 clone 断开原来引用。只能有 engine 提供的机制去找对应的 patchNode
				createElement: (vnode, cnode) => {
					const element = composedCreateElement(vnode, cnode)
					// 因为 html form 本身是 uncontrolled，要实现元素的 value 和上面 value 绑定的 reactive 数据一致。
					// 就必须在每次事件修改后判断一下，强行和 value 一致。
					// 这里先在创建的时候先把 element 和上面绑定的 value 记录一下，之后在事件处取出来重新同步。
					if (isFormElement(element) && 'value' in vnode.attributes) {
						formElementToBindingValue.set(element, vnode.attributes.value)
					}

					return element
				},
				updateElement: (vnode, cnode) => {
					// update 的时候可能会更新 form element 的引用。
					// TODO 大问题，可能会出现当前的 element 已经被卸载，element ref 不存在了的情况！！！！！！
					//  还是要整理视图和 reactive 数据联动的问题！！！
					const updatedElement = composedUpdateElement(vnode, cnode)
					if (isFormElement(updatedElement) && 'value' in vnode.attributes) {
						formElementToBindingValue.set(updatedElement, vnode.attributes.value)
					}
				},
				...rest
			}
		},
		paint: vnode => ctree = scheduler.startInitialSession(vnode),
		receiveScheduler: s => scheduler = s,
		apply: fn => scheduler.startUpdateSession(fn),
		dump() {},
		getCtree: () => ctree,
		destroy: () => {
			// TODO 目前只是利用 diff 的 toDestroy 去销毁了所有的 computed。dom 事件之类的没处理
			ctree.props.destroyed = true
			changedCnodes.push(ctree)
			scheduleCnodeToRepaint()
		}
	}
}

function composeInterceptors(createBaseResult, interceptors, method) {
	return (...runtimeArgv) => {
		const baseResult = createBaseResult(...runtimeArgv)
		interceptors.forEach(intercept => intercept(...baseResult))
		return method(...baseResult)
	}
}


function translateRefAttributes(injectedVnode) {
	injectedVnode.attributes = injectedVnode.attributes ?
		mapValues(injectedVnode.attributes, (attribute) => {
			return isRef(attribute) ? attribute.value : attribute
		}) :
		injectedVnode.attributes
}


function attachScopeId(injectedVnode, cnode) {
	// update 的时候不会传 cnode。
	if (cnode.scopeId) {
		// TODO 这里得有个关于 dataset 关键字的提示。
		injectedVnode.dataset = {
			...injectedVnode.dataset || {},
			scopeId: cnode.id
		}
	}
}

function attachLayoutStyle(injectedVnode) {
	/**
	 * 读取 layout 样式，写到 style 上。也可以写到 class 上，如果写到 class 上，就用 Mutation Observer 来监听卸载。
	 */
	if (layoutManager.match(injectedVnode)) {
		const style = layoutManager.parse(injectedVnode.attributes, injectedVnode)
		if (style) {
			injectedVnode.attributes = {
				...injectedVnode.attributes,
				// 注意这里的顺序，还是写在 attribute.style 的优先级最高，这样才能让 feature 进行完全覆盖。
				style: Object.assign({}, style, injectedVnode.attributes.style )
			}
		}
	}
}



