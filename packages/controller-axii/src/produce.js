import { setUseProxies, enablePatches, enableMapSet, setAutoFreeze } from 'immer'
import { applyPatch as internalApplyPatch } from 'fast-json-patch'
// TODO produce 还要处理复杂的结构，如 moment.js
export { createDraft, produce, finishDraft } from 'immer'

enableMapSet()
enablePatches()
setUseProxies(true)
// CAUTION Immer 会 auto freeze ，导致出现问题
setAutoFreeze(false)

function normalizePath(path) {
  return '/' + path.join('/')
}

// CAUTION immer 的 applyPatches 不能处理 ref，所以这里换了一个。
export function applyPatches(obj, changes) {
  internalApplyPatch(obj, changes.map(p => ({...p, path: normalizePath(p.path)})))
}

