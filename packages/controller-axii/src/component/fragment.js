import {createElementsContainer, FragmentDynamic, walkVnodes} from "./utils";


export function createFragmentActionReceiver(fragmentName, collectors, globalConfigs) {
	// CAUTION 不能把 localVars 存在 receiver 上面，因为可能有重名的情况，例如数组、树 的迭代等。
	// 只能用 frame 的方式，并且要求这个过程中2
	function ReceiverAlsoAsRenderer(localVars, nonReactive) {
		return function render(vnodeOrFn) {
			return new FragmentDynamic(fragmentName, vnodeOrFn, localVars, nonReactive)
		}
	}

	// 收集 fragment 作用域下对 element 的 style 定义，对 element 的事件监听
	ReceiverAlsoAsRenderer.elements = createElementsContainer()
	ReceiverAlsoAsRenderer.argv = {}

	// modifications
	ReceiverAlsoAsRenderer.$$modifications = []
	Object.defineProperty(ReceiverAlsoAsRenderer, 'modify', {
		get() {
			return (modifyFn) => ReceiverAlsoAsRenderer.$$modifications.push(modifyFn)
		},
	})

	Object.defineProperty(ReceiverAlsoAsRenderer, 'getModifications', {
		get() {
			return () => ReceiverAlsoAsRenderer.$$modifications
		},
	})

	// preparations
	ReceiverAlsoAsRenderer.$$preparations = []
	Object.defineProperty(ReceiverAlsoAsRenderer, 'prepare', {
		get() {
			return (prepareFn) => ReceiverAlsoAsRenderer.$$preparations.push(prepareFn)
		},
	})

	Object.defineProperty(ReceiverAlsoAsRenderer, 'getPreparations', {
		get() {
			return () => ReceiverAlsoAsRenderer.$$preparations
		},
	})

	return ReceiverAlsoAsRenderer
}