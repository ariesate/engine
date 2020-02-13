import { invariant } from './util';

let currentWorkingCnode = null
let currentWorkingCnodeData = undefined
export function withCurrentWorkingCnode(cnode, fn) {
  invariant(currentWorkingCnode === null, 'last working unit is not done')
  currentWorkingCnode = cnode
  const result = fn()
  currentWorkingCnode = null
  currentWorkingCnodeData = undefined
  return result
}

export function getCurrentWorkingCnode(initialData) {
  const data = currentWorkingCnodeData === undefined ? initialData : currentWorkingCnodeData
  return [currentWorkingCnode, data, (nextData) => currentWorkingCnodeData = nextData]
}