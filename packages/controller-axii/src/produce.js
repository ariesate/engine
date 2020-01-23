import { finishDraft as internalFinishDraft, setUseProxies } from 'immer'
export { createDraft } from 'immer'
import { applyPatch as internalApplyPatch } from 'fast-json-patch'

setUseProxies(true)

function normalizePath(path) {
  return '/' + path.join('/')
}

export function finishDraft(draft) {
  let changes = []
  const result = internalFinishDraft(draft, (patch) => changes = patch)
  return [result, changes]
}

export function applyPatch(obj, changes) {
  internalApplyPatch(obj, changes.map(p => ({...p, path: normalizePath(p.path)})))
}

