import { setUseProxies, enablePatches, enableMapSet } from 'immer'
import { applyPatch as internalApplyPatch } from 'fast-json-patch'
export { createDraft, produce, finishDraft } from 'immer'

enableMapSet()
enablePatches()
setUseProxies(true)

function normalizePath(path) {
  return '/' + path.join('/')
}

// CAUTION immer 的 applyPatches 不能处理 ref，所以这里换了一个。
export function applyPatches(obj, changes) {
  internalApplyPatch(obj, changes.map(p => ({...p, path: normalizePath(p.path)})))
}

