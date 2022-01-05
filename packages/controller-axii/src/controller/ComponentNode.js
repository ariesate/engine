import {destroyComputed, isReactiveLike, atomLike, collectReactive, setDisplayName, getComputation} from "../reactive";
import {filter, invariant, mapValues, tryToRaw} from "../util";
import propTypes from "../propTypes";
import {activeEvent, getCurrentWorkingCnode, reactiveToOwnerScope} from "../renderContext";
import {applyPatches, produce} from "../produce";
import { replaceVnodeComputedAndWatchReactive } from './VirtualComponent'
import watch from "../watch";
import {isComponentVnode, layoutManager} from "./index";

const seenTypes = new WeakSet()

/**
 * ComponentNode
 * 这个对象最终会传个 painter 作为创建 cnode 的依据。
 * 使用这个对象可以将很多代码从 controller 的 initialRender/updateRender 中抽出来
 *
 * TODO 组件回调里会产生异步 task 的问题，没有考虑。应该提供全局的 task 管理工具？？？
 * 除了 ajax，现在绘图的工具也可能出现，还有 web worker。
 */
export default class ComponentNode {
	constructor(type) {
		this.localProps = {}
		// render 过程中创造的 reactive prop/reactive vnode 收集在这里，之后要回收。
		this.computed = []
		// 用户使用 useEffect 存的 fn。
		this.viewEffects = []
		// effect return 的清理函数
		this.effectClearHandles = []
		// 框架会为 ComponentNode 提供 parent，主要用来往上寻找 context
		this.parent = null
		// key: context 对象. value: 创建时的 defaultValue 或者 Provider value 中提供的
		this.contexts = new Map()
		// sideEffect 组件级别的 sideEffect，不只是实例级别的。
		if (!seenTypes.has(type)) {
			if (type.sideEffect) {
				type.sideEffect()
			}
			seenTypes.add(type)
		}
	}

	clearComputed()  {
		this.computed.forEach(computed => destroyComputed(computed))
		this.computed = []
	}
	// 组件 render 的过程中产生的所有 computed 都要收集起来！computed 是需要手动销毁的。
	collectReactive(operation, scope) {
		let result
		const [sourceWithCallers, innerComputedArr] = collectReactive(() => {
			result = operation()
		})
		// 收集 computed, 之后组件更新要主动销毁
		this.computed.push(...innerComputedArr)
		// 收集 source, 主要是用来给 devtools 用的
		// 有可能没 scope，例如 render 中创建的 watch 也用了收集，但不会创建用户需要的 ref，所以会不传第二参数。
		if (scope) sourceWithCallers.forEach((source) => {
			reactiveToOwnerScope.set(source, scope)
		})

		return result
	}
	// AXII lifeCycle: 在 supervisor 中发现是 toInitialize 的节点时调用
	willMount() {
		// virtual type 的 watch 和清理工作都放到 render 里面去做了，这样能最大化保持一致性。见 virtualCnodeRender
	}
	// AXII lifeCycle: 在 节点真正挂载了并且 session 结束了之后触发。
	didMount() {
		// viewEffects 里面允许创建 watch，同样会自动回收
		this.collectReactive(() => {
			this.viewEffects.forEach((effect) => {
				const effectCallback = effect()
				if (effectCallback) {
					invariant(typeof effectCallback === 'function', 'effect callback must be a function')
					this.effectClearHandles.push(effectCallback)
				}
			})
		})
	}
	// AXII lifeCycle: 在 supervisor 中发现不存在了时直接调用。
	willUnmount() {
		// 1. 回收 render 中间产生的所有 computed。包括 watch token，其实也是 computed。
		this.clearComputed()
		// 2. 清理 didMount 中产生的 viewEffect
		this.effectClearHandles.forEach((clearEffect) => {
			if (clearEffect instanceof Promise) {
				clearEffect.then(resultFn => resultFn())
			} else {
				clearEffect()
			}
		})
	}
	// AXII lifeCycle: willUpdate。
	willUpdate() {
		// virtual type 的 watch 和清理工作都放到 render 里面去做了，这样能最大化保持一致性。见 virtualCnodeRender
	}
	render() {
		return this.type.isVirtual ? this.virtualCnodeRender(): this.cnodeRender()
	}
	cnodeRender() {
		/**
		 * cnode 的变化只会来自于父组件。render 不管是更新还是初次，函数的执行都可能创建新的 computed。所以要 clearComputed。
		 * 会收集到的 computed 有：
		 * 1. 自己内部计算中声明的 computed。
		 * 2. render 结果中创建的 vnodeComputed。
		 * 3. 对 reactive props 进行的 watch。
		 */
		this.clearComputed()
		return this.collectReactive(() => {
			/**
			 * 1. 在这个过程中会 watch reactive props，当发生变化时，就出触发局部更新。
			 * 2. 把新产生的 vnodeComputed 替换成 Virtual Component。注意
			 *   2.1 我们是不 watch vnodeComputed 的。vnodeComputed 里面变化由相应的 Virtual Component 负责(实际上是 vnodeComputed 自己内部处理)。
			 *   2.2 但是这个它是在我们的作用域里创建的，并且在用户概念里它也是属于这个组件，因此要负责销毁他。
			 */
			const renderResult = this.type(createInjectedProps(this), this.ref)
			// 我们允许外部传递 layout:xxx 的属性进来，在这里要 patch 到 result 上，才能被正确 replace 掉
			processLayoutAttributes(this, renderResult)

			return replaceVnodeComputedAndWatchReactive(
				renderResult,
				(patchNode) => this.reportChangedVnode(patchNode, this),
				this
				)
		}, this.type)
	}
	virtualCnodeRender() {
		/**
		 * 其实 this.type 并没有重新计算，计算过程再 reactive digest 的时候就已经算出来了，这里只是取出数据而已。
		 * Virtual 因为更新而产生的的render 有两种不同的来源：
		 * 1. 由于自身内部依赖的数据变化了，这种情况其实是可以不用再重新 watch 的。
		 * 2. 父组件重新 render 了，由于创建 Virtual 时做了 Virtual 类型的缓存，希望继续在 Virtual 内部利用 diff。
		 * 这个时候通过 this.type() 拿到的 result 已经不是上一次的引用了而是上层 render 函数执行时创建的新的 vnodeComputed。
		 * 这时候就要把上一次的 watch 清理掉
		 *
		 * Virtual Component 就是一个壳，内核是里面的 vnodeComputedRef。
		 */
		const vnodeComputedRef = this.type()


		if (this.lastVnodeComputedRef !== vnodeComputedRef) {

			// 说明这是来自于父组件 render 的变化，引用已经不一样了。
			// 这个 vnodeComputed 不需要自己来销毁，因为它是在上层创建的，上层组件在重新渲染时会销毁掉的。
			// 基本原则是谁创建的 computed，谁负责销毁。
			this.lastVnodeComputedRef = vnodeComputedRef

			// 这个 watch 是我们创造的，所以要收集和销毁
			this.clearComputed()
			this.collectReactive(() => {
				watch(() => vnodeComputedRef.value, () => this.reportChange(this))
			})
		} else {
			// TODO 需要个检测，看看 value 是否真的变化了，如果发现没变，说明更新机制出问题了
			// 说明这是来自于内部的变化，也就是 watch 回调中使用 this.reportChange 产生的更新。
			// 这个时候不用做任何处理。
		}
		// 不管 vnodeComputedRef 引用有没有变，vnodeComputedRef.value 肯定变化了，这里是最新的，也要进行 reactiveProps watch 和 vnodeComputed 的替换。
		return this.collectReactive(() => {
			return replaceVnodeComputedAndWatchReactive(
				vnodeComputedRef.value,
				(patchNode) => this.reportChangedVnode(patchNode, this),
				this
			)
		}, getComputation(vnodeComputedRef))

	}
}


function processLayoutAttributes(cnode, result) {
	if (!cnode.type.isVirtual) {
		// 2. 普通组件
		const [layoutPropsWithoutNamespace, layoutPropsWithNamespace] = layoutManager.processLayoutProps(cnode.props)

		// 把 cnode 上面的 layout props 穿透到渲染出来后的第一层上。如果第一层还是组件，那么还要穿透。
		if (layoutPropsWithoutNamespace) {
			if(isComponentVnode(result)) {
				result.attributes = Object.assign({}, result.attributes, layoutPropsWithNamespace)
			} else {
				result.attributes = Object.assign({}, result.attributes, layoutPropsWithoutNamespace)
			}
		}
	}
}


function createInjectedProps(cnode) {
	const { props, localProps } = cnode
	const { propTypes: thisPropTypes } = cnode.type

	const fixedProps = {}

	Object.entries(thisPropTypes || {}).forEach(([propName, propType]) => {
		if (!(propName in props)) {
			// 这里和 propTypes 有约定，每次读 defaultValue 时都会用定义的 createDefaultValue 创造新的对象，
			// 所以不用担心引用的问题。
			if (propType.createDefaultValue) {
				localProps[propName] = propType.createDefaultValue({...props, ...localProps})
				if (isReactiveLike(localProps[propName])) setDisplayName(localProps[propName])
			}
		} else if (!isReactiveLike(props[propName]) && !isSmartProp(props[propName])) {
			// CAUTION 注意一定要排除 smartProp
			// 对值对象中的简单类型，"数字、文字、bool"，还要包装成 ref 的形式。
			// 对传入固定值(非 reactive 值)，比如 bool/number 等的 prop 进行包装，兼容 reactive 格式。
			// 后面 patch 的时候会判断，对于非 reactive 的值，都当做是固定值，不进行 patch
			fixedProps[propName] = isNaivePropType(propType) ? atomLike(props[propName]) : props[propName]
			if (isReactiveLike(fixedProps[propName])) setDisplayName(fixedProps[propName])
		}
	})


	const mergedProps = { ...props, ...localProps, ...fixedProps }

	// 对两种类型props 特殊处理：
	// 2. 随 smartProp 进行回调处理
	// 3. 开始对其中的 callback 回调 prop 进行注入。
	// TODO 考虑用户不需要 produce 的场景，能不能提前声明？虽然传入的是 ref，但是某些事件就是不要 apply，不是动态决定的，是提前就决定好的。
	// TODO 虽然已经有 overwrite 了，但是还是会去 produce。连这一步也不要有？性能影响到底大不大？
	const transformedProps = mapValues(thisPropTypes || {}, (propType, propName) => {
		const prop = mergedProps[propName]
		if (!propType) return prop
		if (isSmartProp(prop)) {
			return prop(propType, propName)
		}

		if (!propType.is(propTypes.callback) && !propType.is(propTypes.function)) return prop

		// CAUTION 增加了对 function 的缓存处理，我们认为整个系统应该只随着数据变化而变化。
		//  函数变化不应该引起重新 render，除非手动标记。
		if (propType.is(propTypes.function)) return cnode.props[propName] ? (...argv) => cnode.props[propName](...argv) : prop

		// 下面是针对 callback 类型进行补全参数等操作
		return (event, ...restArgv) => {
			// CAUTION 参数判断非常重要，用户既有可能把这个函数直接传给 onClick 作为回调，也可能在其他函数中手动调用。
			// 当直接传给事件回调时，由于事件回调会补足 event，而我们不需要，因此在这里判断一下。
			// 注意，我们认为用户不可能自己把 event 当第一参数传入，没有这样的需求场景。
			const runtimeArgv = ((event === activeEvent.getCurrentEvent() && restArgv.length === 0) || event === undefined) ? [] : [event, ...restArgv]
			// CAUTION 特别注意这里，对于 callback 类型的 prop 一定是在执行时重新去 cnode.props 上去读。
			//  因为我们为了性能作了优化，callback 即使是函数引用变了，我们也不会重新渲染，这时候就靠这里重新去 props 上读来保证使用的是正确的引用了。
			const userMutateFn = cnode.props[propName]

			// 注意这里，defaultMutateFn 可以拿到 props 的引用，这样我们就不用在调用的时候去往第一个参数去传了。
			const defaultMutateFn = propType.createDefaultValue(props)
			const valueProps = filter(mergedProps, isReactiveLike)
			// CAUTION 这里的 Immer draft 是支持 moment 等类型的，要更新 moment 的话，用户自己 new 一个新的并整体赋值。
			let draftChanges = []
			let shouldStopApply
			// CAUTION，把 runtime argv 也 draft 一下，这样就可以实现通过第一参数传递 reactive 对象，同时也能 return false 阻止了。
			const extraArgv = [mergedProps, activeEvent.getCurrentEvent()]
			// CAUTION 这里 map 和 mapValues 回调都不要简写，因为 tryToRaw 有第二参数，简写会传递第二参数
			const argvToDraft = runtimeArgv.map(argv => tryToRaw(argv)).concat(mapValues(mergedProps, prop => tryToRaw(prop)))
			produce(
				argvToDraft, draftArgv => {
					// 我们为开发者补足三个参数，这里和 react 不一样，我们把 event 放在了最后，这是我们按照实践中的权重判断的。
					// 因为我们的组件既是受控的又是非受控的，理论上用户只需要知道组件默认会怎么改 props 就够了，即 draftProps，
					// 常见的我们在 input onChange 中去取 event.target.value 实际上也就是去取 nextProps，如果能拿到，就不需要 event。
					// 补足参数永远放在最后，这样开发者心智负担更小。
					const allArgv = [...draftArgv, ...extraArgv]
					const userArgv = userMutateFn?.disableDraft ? [...runtimeArgv, ...extraArgv] : allArgv
					// 可以传入一个标记为 overwrite 的 callback 来完全复写组件行为
					if (userMutateFn && userMutateFn.overwrite) {
						shouldStopApply = userMutateFn(defaultMutateFn, ...userArgv)
					} else {
						defaultMutateFn(...allArgv)
						// 显式的返回 false 就是不要应用原本的修改。
						// CAUTION 注意这里的补全参数设计，补全的第一参数是事件，第二参数是现在的 prop 和 nextProps
						shouldStopApply = userMutateFn ?
							userMutateFn(...userArgv) === false :
							false
					}
				},
				(patches) => draftChanges.push(...patches)
			)


			if (shouldStopApply) {
				activeEvent.preventCurrentEventDefault()
			} else {
				// 还要过滤掉 valueProps 里面的 fixed 的。应该在 applyPatches 里面判断，只要不是 reactive 的值，就是固定的，就不应该修改。
				const values = [...runtimeArgv, valueProps]
				const changesExcludeFixedValues = filterFixedValueChanges(draftChanges, values)

				applyPatches(values, changesExcludeFixedValues)
			}
		}

	})

	return Object.assign(mergedProps, transformedProps)
}

/**
 * 什么是 smartProp？
 * smartProp 本质上是一个函数，当我们去读这个 prop 时，会调用这个函数，并用它的返回值作为真实的 prop。
 * 为什么需要 smartProp？因为外界可能需要控制我们的数据的引用，但是又不知道当前这个 prop 的类型，无法正确创建。这时候 smartProp 就有用了。
 * 调用回调时会把这个 prop 的 propType 传过去。
 * 具体在 useForm 里面有应用。useForm 希望全局来管理状态，但又无法提前知道 form 组件的 value 具体是什么类型。
 */
export function createSmartProp(callback) {
	invariant(typeof callback=== 'function', 'smart prop must have a function callback')
	callback.isSmart = true
	return callback
}

export function isSmartProp(prop) {
	return typeof prop === 'function' && prop.isSmart
}

export function overwrite(fn) {
	fn.overwrite = true
	return fn
}

// 这个标记未来是可以通过编译工具处理，所以全用大写。
export function DIRTY(fn) {
	fn.isDirty = true
	return fn
}

export function disableDraft(fn) {
	fn.disableDraft = true
	return fn
}

function isNaivePropType(propType) {
	return propType.is(propTypes.string)
		|| propType.is(propTypes.bool)
		|| propType.is(propTypes.number)
}

function filterFixedValueChanges(changes, values) {
	// values 的最后一位是 draftProps,
	const propsIndex = values.length - 1
	const props = values[propsIndex]
	return changes.filter(({ path }) =>{
		// 去掉最前面的 '/'
		if (path[0] === propsIndex) {
			return isReactiveLike(props[path[1]])
		} else {
			return isReactiveLike(values[path[0]])
		}
	})
}


/**
 * 因为 useViewEffect 的调度都是和 cnode 紧密相关的，因此写在这里
 * 这里和 react 的 useEffect 不同，viewEffect 只在 didMount 和 willUnmount 时调用
 */
export function useViewEffect(fn) {
	const cnode = getCurrentWorkingCnode()
	invariant(cnode, 'can only use useViewEffect in component render function')
	cnode.viewEffects.push(fn)
}

function attachContext(context, value) {
	const cnode = getCurrentWorkingCnode()
	cnode.contexts.set(context, value)
}

export function createContext(defaultValue) {
	const context = {}
	function Provider({ value = defaultValue, children }) {
		attachContext(context, value)
		return children
	}
	context.Provider = Provider

	return context
}

export function useContext(context) {
	let currentCnode = getCurrentWorkingCnode()
	let contextValue
	while(contextValue === undefined && currentCnode) {
		contextValue = currentCnode.contexts.get(context)
		currentCnode = currentCnode.parent
	}
	return contextValue
}
