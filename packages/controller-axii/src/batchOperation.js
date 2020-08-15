import { toRaw, isRef } from './reactive';
import { applyPatch, finishDraft, createDraft } from './produce';

export default function batchOperation(reactiveSource, operation) {
  const source = isRef(reactiveSource) ? {value : reactiveSource.value} : toRaw(reactiveSource)
  const draft = createDraft(source)
  operation(draft)
  const [result, changes] = finishDraft(draft)
  applyPatch(reactiveSource, changes)
}