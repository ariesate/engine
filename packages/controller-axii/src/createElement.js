import VNode from '@ariesate/are/VNode'
import vnodeComputed from "./vnodeComputed"
import { createCreateElement, defaultNormalizeLeaf } from '@ariesate/are/createElement'

// TODO deprecate
let shouldReplaceFunction = false

const methods = createCreateElement((rawChild) => {
	const vnode = defaultNormalizeLeaf(rawChild)

	if (vnode instanceof VNode) return vnode
	if (shouldReplaceFunction && typeof rawChild === 'function') return vnodeComputed(rawChild)

	return rawChild
})

export function stopReplaceFunction() {
	const lastConfig = shouldReplaceFunction
	shouldReplaceFunction = false
	return () => {
		shouldReplaceFunction = lastConfig
	}
}

export default function createElement(...argv) {
	const vnode = methods.createElement(...argv)
	// CAUTION 这是为了让 createComponent 中的 Feature 仍然能够按照 props 的方式去操作。
	// 理论上应该是对 render result 生成 proxy 处理，这里是快速实现，之后修改。
	if (vnode.attributes) {
		vnode.props = vnode.attributes
	}
	return vnode
}
export const cloneElement = methods.cloneElement
export const normalizeLeaf = methods.normalizeLeaf
export const shallowCloneElement = methods.shallowCloneElement
