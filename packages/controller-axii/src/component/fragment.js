import { composeRef } from "../util";

/**
 *  createFragmentReceiver 创建出来的就是 fragments[fragmentName] 这个对象。
 *  Base 会用这个对象来定义 fragment，使用 thunk 的形式，先传 localVars。
 *  例如 frag.a(localVars)(renderFunction)
 *
 *  Feature 中使用这个对象来挂载需要对 fragment 进行的 modification/preparation 等。
 */
export function createFragmentReceiver(fragmentName, collectors, globalConfigs, fragmentSummary) {
	//CAUTION 不能把 localVars 存在 receiver 上面，因为可能有重名的情况，例如数组、树 的迭代等。
	function FragmentReceiver(localVars, nonReactive) {
		return function receiveFragment(vnodeOrFn) {
			//CAUTION 这里返回的是一个"标志对象"，对象上面记录了当前 fragment 的信息。
			// 为什么不直接 return vnodeComputed？因为在定义的时候这上面的信息还不全，这里无法获取到上层
			// 作用域中的 localVars，祖先 fragmentName 等。一定要再从外部的遍历进来才可能收集到足够的信息。
			// 这些信息是 Feature 需要的，因为 Feature 是外部作用域了，只能靠我们传。
			return new FragmentDynamic(fragmentName, vnodeOrFn, localVars, nonReactive)
		}
	}

	// 收集 fragment 作用域下对 element 的 style 定义，对 element 的事件监听
	FragmentReceiver.elements = createElementProxyAgent(fragmentSummary)

	// TODO deprecated???
	FragmentReceiver.argv = {}

	Object.defineProperty(FragmentReceiver, 'modify', {
		get() {
			return (modifyFn) => {
				fragmentSummary.modifications.push(modifyFn)
			}
		},
	})

	Object.defineProperty(FragmentReceiver, 'prepare', {
		get() {
			return (prepareFn) => {
				fragmentSummary.preparations.push(prepareFn)
			}
		},
	})

	// 注册 fragment render 的时候检视每一个节点的函数，主要用于搭建系统收集 render point
	Object.defineProperty(FragmentReceiver, 'inspect', {
		get() {
			return (inspector) => {
				fragmentSummary.inspectors.push(inspector)
			}
		},
	})
	
	return FragmentReceiver
}



export class FragmentDynamic {
	constructor(name, render, localVars, nonReactive) {
		this.name = name
		this.render = render
		this.localVars = localVars
		this.nonReactive = nonReactive
	}
}


function createElementProxy(elementSummary) {

	return new Proxy({}, {
		get(target, key) {

			if (key === 'style') {
				return styleFn => {
					elementSummary.styles.push(styleFn)
				}
			} else if (key === 'modify') {
				return modifyFn => {
					elementSummary.modifiers.push(modifyFn)
				}
			} else if (key === 'match') {
				return new Proxy({}, {
					get(target, pseudoClass) {
						return {
							style(rules) {
								elementSummary.pseudoClassStyles.push({ name: pseudoClass, rules })
							}
						}
					}
				})
			} else if (key === 'ref') {
				// 用 modify 来实现的
				return featureRef => {
					const refModifier = (vnode) => {
						vnode.ref = composeRef(vnode.ref, featureRef)
					}
					elementSummary.modifiers.push(refModifier)
				}
			}else if (/^on/.test(key.toString())) {
				return listener => {

					if (!elementSummary.listeners[key]) elementSummary.listeners[key] = []
					elementSummary.listeners[key].push(listener)
				}
			} else {
				throw new Error(`unknown action: key: ${key}`)
			}
		}
	})
}

/**
 * elementsAgent 就是 fragment[fraName].elements，可以用它来：
 *
 * 1. style/伪类 设置
 * fragments[name].elements.input.style = {}
 * fragments[name].elements.input.match.hover.style({})
 * 2. listener 设置
 * fragments[name].elements.input.onFocus = function() {}
 * 3. 修改
 * fragments[name].elements.modify((vnode, argv) => {})
 * 4. 获取所有记录的信息
 * fragments[name].elements.input.getStyle()
 * fragments[name].elements.input.getListeners()
 */
export function createElementProxyAgent(fragmentSummary) {
	const elementProxies = {}
	const dynamicMatchers = new Map()

	//CAUTION elements 支持使用函数来动态匹配。
	function setDynamicMatcherOrGet(matcherOrTarget) {
		if (typeof matcherOrTarget === 'function') {
			if (!fragmentSummary.dynamicElements.get(matcherOrTarget)) fragmentSummary.dynamicElements.set(matcherOrTarget, createElementSummary())

			if (!dynamicMatchers.get(matcherOrTarget)) dynamicMatchers.set(matcherOrTarget, createElementProxy(fragmentSummary.dynamicElements.get(matcherOrTarget)))
			return dynamicMatchers.get(matcherOrTarget)
		} else {

			const findMatches = () => {
				const result = []
				dynamicMatchers.forEach((elementProxy, matcher) => {
					if (matcher(matcherOrTarget)) result.push(elementProxy)
				})
				return result
			}
		}
	}

	const instruments = {
		forEach(handle) { Object.entries(elementProxies).forEach(handle) },
		forEachDynamic(handle) { dynamicMatchers.forEach(handle) }
	}

	return new Proxy(setDynamicMatcherOrGet, {
		get(target, elementName) {
			if (instruments[elementName]) return instruments[elementName]

			if (!fragmentSummary.elements[elementName]) fragmentSummary.elements[elementName] = createElementSummary()
			if (!elementProxies[elementName]) elementProxies[elementName] = createElementProxy(fragmentSummary.elements[elementName])
			return elementProxies[elementName]
		},
		set() {
			return false
		}
	})
}


/**
 * fragmentAgent 存着当前 feature 对所有 fragments 的 action。
 * 真正去收集的是 fragmentLevelCollector。
 * 这个对象通常传到 feature 中变量名叫做 fragments。使用时就是: fragments.root.modify(xxx)
 */
function createFragmentAgent(name, container, globalConfigs, summary) {
	const collector = {
		$$fragments: {},
		$$argv: new WeakMap()
	}

	const instruments = {
		forEach(target, fn) {
			Object.entries(target.$$fragments).forEach(fn)
		},
	}

	const attributes = {
		name
	}

	return new Proxy(collector, {
		get(target, key) {
			if (instruments[key]) return (...argv) => instruments[key](collector, ...argv)
			if (key in attributes) return attributes[key]
			// anonymous 作为保留的名字，是用来给框架处理 function/vnodeComputed 节点的。
			const fragmentName = key === 'anonymous' ? '$$' : key

			// 直接更新 summary
			if(!summary[fragmentName]) {
				summary[fragmentName] = createFragmentSummary()
			}

			if (!collector.$$fragments[fragmentName]) {
				collector.$$fragments[fragmentName] = createFragmentReceiver(fragmentName, collector, globalConfigs, summary[fragmentName])
			}

			return collector.$$fragments[fragmentName]
		}
	})
}


function createFragmentSummary() {
	return {
		preparations: [],
		modifications: [],
		inspectors : [],
		elements: {},
		dynamicElements: new Map()
	}
}

function createElementSummary() {
	return {
		styles: [],
		listeners: {},
		modifiers: [],
		pseudoClassStyles: []
	}
}

export function createFragmentAgentContainer(globalConfigs) {
	const container = new Map()
	const summary = {}
	return {
		derive(key) {
			let fragmentAgent = container.get(key)
			if (!fragmentAgent) container.set(key, (fragmentAgent = createFragmentAgent(key.displayName || key.name, container, globalConfigs, summary)))
			return fragmentAgent
		},
		forEach(handle) {
			return container.forEach(handle)
		},

		summary
	}
}