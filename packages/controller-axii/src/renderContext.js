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

export const activeEvent = (function() {
  let currentEvent = null
  let shouldPreventDefault = false
  function withEvent(event, handler) {
    currentEvent = event
    handler(() => shouldPreventDefault)
    currentEvent = null
    shouldPreventDefault = false
  }

  function preventCurrentEventDefault() {
    if (currentEvent) shouldPreventDefault = true
  }

  function getCurrentEvent() {
    return currentEvent
  }

  return {
    withEvent,
    preventCurrentEventDefault,
    getCurrentEvent,
  }
})()