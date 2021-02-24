import { refComputed } from './reactive'

export default function vnodeComputed(computation) {
	const result = refComputed(computation)

	result.isVnodeComputed = true
	result.displayName = computation.displayName || computation.name

	return result
}

export function isVnodeComputed(obj) {
	return obj && obj.isVnodeComputed
}
