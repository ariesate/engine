import { invariant } from './util';

/**
 * 所有 axii 中要利用浏览器js"单线程"来共享的上下文都放在这里。
 * 这些对象应该在用完了就要清理干净。
 */

let currentWorkingCnode = null
let currentWorkingCnodeData = undefined
export function withCurrentWorkingCnode(cnode, fn) {
  invariant(currentWorkingCnode === null, 'last working unit is not done')
  currentWorkingCnode = cnode
  let error
  let result
  try {
    result = fn()
  } catch(e) {
    error = e
  } finally {
    currentWorkingCnode = null
    currentWorkingCnodeData = undefined
  }

  if (error) throw error

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

