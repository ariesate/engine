import { atomComputed } from './reactive'

export default function vnodeComputed(computation) {
	const result = atomComputed(computation)

	result.isVnodeComputed = true
	result.displayName = computation.displayName || computation.name

	return result
}

export function isVnodeComputed(obj) {
	return obj && obj.isVnodeComputed
}
