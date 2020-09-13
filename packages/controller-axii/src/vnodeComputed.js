import { refComputed } from './reactive'

let shouldBeLazy = false

export default function vnodeComputed(computation) {
	const result = shouldBeLazy ? {
		computation,
	} : refComputed(computation)

	result.isVnodeComputed = true
	result.displayName = computation.displayName || computation.name

	return result
}

export function isVnodeComputed(obj) {
	return obj && obj.isVnodeComputed
}

export function lazyComputed() {
	const last = shouldBeLazy
	shouldBeLazy = false
	return () => {
		shouldBeLazy = last
	}
}