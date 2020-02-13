import { createIdGenerator, pushToSet } from './util';
import { invariant } from '../util';
import { isRef, reactive, ref, toRaw } from './reactive';
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { isReactiveLike } from './index';

// computed 中允许建立再建立 computed，例如在 vnodeComputed 中用到了。建立一个 frame 用来正确地收集数据。
const computedRelation = new WeakMap()

// 把正在计算中的 compute 都存在这里，这样能检测到循环的 compute 进行报警。
const computationStack = [];

const reactiveToPayloads = new WeakMap()
const reactiveToListeners = new WeakMap()

export const ITERATE_KEY = Symbol('iterate');
const ANY_KEY = Symbol('any')


function getFromMap(collection, key, createIfUndefined) {
  let result = collection.get(key)
  if (!result && createIfUndefined) collection.set(key, (result = createIfUndefined()))
  return result
}

/**
 * 有向无环图来表达 indep 和 dep。indep: 自变量。dep: 因变量。
 * source 表示自然创建的 reactive 对象。computed 表示 createComputed 创建的对象。
 * source 只有可能是某个 computation 中的 indep，不可能是 dep。
 * computed 可以是其他 computed 的 indep。同时也必然是某个 computation 的 dep。
 *
 * 整体关系：
 * source <-[1:n]-> key <-[n:n]-> computation <-[1:1]-> computed
 *
 * source|computed: Reactive
 *   - $$payload.keys: Map<keyName, key>
 *   - $$payload.computation : ?Computation
 *
 * key: KeyNode
 *   - indep: Reactive
 *   - computations: Set<Computation>
 *
 * computation: Computation
 *   - indeps: Set<Key>
 *   - computed: Reactive
 *   - scopeId: scopeId 用来标记中间变量的。目前用于 derive 中。
 *
 * 内存模型：
 * computed 对象的外部引用销毁时。与 computation 的联系，以及自己的 deps 会销毁。
 * 但同时要通过 computation 主动销毁掉自己的 indeps。
 */

/****************************************
 * Computed
 ****************************************/
export const TYPE = {
  REF: Symbol('ref'),
  ARRAY: Symbol('array'),
  OBJECT: Symbol('object')
}

export function isComputed(obj) {
  if (!obj) return false
  const payload = getFromMap(reactiveToPayloads, toRaw(obj))
  return payload && payload.computation
}

export function refComputed(computation) {
  return createComputed(computation, TYPE.REF)
}

export function arrayComputed(computation) {
  return createComputed(computation, TYPE.ARRAY)
}

export function objectComputed(computation) {
  return createComputed(computation, TYPE.OBJECT)
}

class ComputedToken {}

export function createComputed(computation, type) {
  invariant(typeof computation === 'function', 'computation must be a function')

  const computed = type ? (type === TYPE.REF ? ref(undefined) : reactive( type === TYPE.OBJECT ? {} : [])) : (new ComputedToken())
  const payload = getFromMap(reactiveToPayloads, toRaw(computed), createPayload)
  payload.computation = computation

  computation.computed = computed
  computation.indeps = new Set()
  computation.type = type
  // 用来标记 scope 的，后面可以用 scopeId skip 掉计算过程。
  computation.scopeId = activeScopeId

  // 执行 compute 的时候会 track 依赖。
  compute(computation)

  return computed
}

export function destroyComputed(computed) {
  const payload = getFromMap(reactiveToPayloads, toRaw(computed))
  if (payload) {
    invariant(Object.values(payload.keys).every(({ computations }) => computations.size === 0), 'computed have deps, can not destroy')
    if (payload.computations) {
      delete payload.computation.scopeId
      delete payload.computation.type
      delete payload.computation.computed
      payload.computation.indeps.forEach(keyNode => {
        keyNode.computations.delete(payload.computation)
      })
      delete payload.computation.indeps
    }
  }
}


/****************************************
 * Computation
 ****************************************/

function applyComputation() {
  const { computation } = computationStack[computationStack.length - 1]
  function watchAnyMutation(source) {
    track(toRaw(source), TrackOpTypes.ANY, ANY_KEY)
  }

  const nextValue = computation(watchAnyMutation)
  if(!(computation.computed instanceof ComputedToken)) {
    replace(computation.computed, nextValue)
  }
}


/**
 * compute 的执行时机：
 * 1. createComputed。第一次建立联系，此时可能出现 computed 中再创建 computed，computationStack 中已有值。
 * 2. digestComputations。compute 中再触发的 computation 只会加入到 digest 尾部。因此 computationStack 只会有一个。
 */
function compute(computation) {
  invariant(!computationStack.find(({computation: c}) => c === computation ), 'recursive computation detected')
  try {
    computationStack.push({computation, indeps: new Set()});
    // 会从 computationStack 中读当前的 frame，所以不用传值。
    // 到 compute 的时候一定已经在一个 computations running 周期里了。里面的再触发的加到了队列末尾
    applyComputation()
    patchComputation()
    // computed
    patchComputedRelation()
  }
  catch(e) {
    console.error(e)
  }
  finally {
    computationStack.pop();
  }
}

// 清理之前的 indeps
function patchComputation() {
  const { computation, indeps: nextIndeps } = computationStack[computationStack.length - 1]
  const { indeps: prevIndeps } =  computation

  computation.indeps = nextIndeps
  computation.indeps.forEach(keyNode => {
    if (!prevIndeps.has(keyNode)) {
      // 新增的
      keyNode.computations.add(computation)
      // TODO sync 标记的判断,只有一个标记时要遍历下去
    } else {
      // 原来就有的，这次还有
      prevIndeps.delete(keyNode)
    }
  })
  // 最后 prevIndeps 里面还剩下的就是要删除的
  prevIndeps.forEach(toRemoveKeyNode => {
    toRemoveKeyNode.computations.delete(computation)
    // TODO sync 标记的判断,移除的标记如果没有了，要遍历下去。
  })
}

function patchComputedRelation() {
  const { computation } = computationStack[computationStack.length - 1]
  // 先清理掉依赖于当前项 computed
  let current
  const computationToClear = [computation]
  while(current = computationToClear.shift()) {
    const childComputations = computedRelation.get(current)
    if (childComputations) {
      computationToClear.push(...childComputations)
      destroyComputed(computation.computed)
    }
  }

  // 重新建立当前和 parent 的关系
  const parentFrame = computationStack[computationStack.length - 2]
  if (parentFrame) {
    let children = computedRelation.get(parentFrame)
    if (!children) computedRelation.set(parentFrame, (children = []))
    if (!children.includes(computation)) children.push(computation)
  }
}


const cachedComputations = []
let inComputationDigestion = false
function digestComputations() {
  invariant(!inComputationDigestion, 'already in computation digestion')
  inComputationDigestion = true
  let computation
  while(computation = cachedComputations.shift()) {
    compute(computation)
  }
  inComputationDigestion = false
}

function scheduleToRun(computations) {
  computations.forEach(c => {
    if (!shouldSkipComputation(c) && !cachedComputations.includes(c)) {
      cachedComputations.push(c)
    }
  })
  if (!inComputationDigestion) {
    digestComputations()
  }
}


/****************************************
 *
 * Trigger & Track
 *
 * trigger 的时候判断要 sync 的 computation。
 * 把 keyNode 上的 computations 分出一部分 syncComputations。
 * 1. 只对 syncComputations 进行 trigger。
 * 2. 剩下的依赖都标记为 dirty。因为标记的时候是无差别的标记 TODO 会不会出现标记反而更加耗费性能。？？？
 * 3. TODO 会不会有什么问题，所有链路全部想一下。特别是 reverseComputation 和 cache 结合在一起？？？
 *
 *****************************************/

let shouldTrack = true;

export function pauseTracking() {
  shouldTrack = false;
}

export function resumeTracking() {
  shouldTrack = true;
}

export function track(indep, type, key) {
  // CAUTION 不能读自己，哪怕能达到稳定态也不行
  const frame = computationStack[computationStack.length -1]
  if (!shouldTrack || !frame || indep === toRaw(frame.computation.computed)) {
    return;
  }
  const payload = getFromMap(reactiveToPayloads, toRaw(indep), createPayload)
  const keyNode = getFromMap(payload.keys, key, () => createKeyNode(indep))
  frame.indeps.add(keyNode)
}



// CAUTION 过滤掉要 skip 的 computation。 这个标记先打在 computation 上。这是专门给 inverseComputed 用的。
function shouldSkipComputation(computation) {
  return scopeIdToSkip && (computation.scopeId === scopeIdToSkip)
}

export function trigger(source, type, key, extraInfo) {
  // 执行了赋值操作，但数据没变，外部可以要求仍然触发 trigger。
  // derive 中需要追踪某个数据改变后，所有可能影响的数据，用于保持一致性。所以用 trigger，外部继续监听的方式来找到所有可能影响的。
  if (type === TriggerOpTypes.SET && extraInfo ) {
    if (scopeIdToSpreadUnchanged) triggerUnchangedInScope(source, scopeIdToSpreadUnchanged)
    return
  }

  const { keys } = getFromMap(reactiveToPayloads, toRaw(source), createPayload)
  // 剩下的都是真正改变过的

  if (type === TriggerOpTypes.CLEAR /* CLEAR */) {
    // collection being cleared, trigger all effects for target
    // 触发所有依赖于此 indep 的 computation
    keys.forEach(({ computations }) => {
      scheduleToRun(computations)
    });
  }
  else {
    // SET | ADD | DELETE 触发依赖于相应的 key 的 computation
    if (key) {
      const { computations } = getFromMap(keys, key, () => createKeyNode(source))
      scheduleToRun(computations)
    }
    // 如果触发了长度变化(add|delete)，那么还要触发监听了 length 或进行过遍历的 computed
    if (type === "add" /* ADD */ || type === "delete" /* DELETE */) {
      const iterationKey = Array.isArray(source) ? 'length' : ITERATE_KEY;
      const { computations} = getFromMap(keys, iterationKey, () => createKeyNode(source))
      scheduleToRun(computations);
    }
  }

  // 把 any 取出来
  const { computations} = getFromMap(keys, ANY_KEY, () => createKeyNode(source))
  scheduleToRun(computations)
}

/****************************************
 * Scope
 *****************************************/
// scope 只能打在 computed 上
let activeScopeId = null
const generateScopeId = createIdGenerator()
export function startScope(fn){
  const id = generateScopeId()
  activeScopeId = id
  try {
    fn()
  } finally {
    activeScopeId = null
  }
  return id
}

// 用 Reverse compute 来实现更好。
export function unsafeComputeScope(scopeId, sourceMutation, depsMutation) {
  const stopSkip = skipScope(scopeId)
  sourceMutation()
  stopSkip()
  depsMutation()
}

let scopeIdToSpreadUnchanged = null
export function spreadUnchangedInScope(scopeId, applyChange) {
  scopeIdToSpreadUnchanged = scopeId
  applyChange()
  scopeIdToSpreadUnchanged = null
}


function triggerUnchangedInScope(source, scopeId) {
  invariant(scopeIdToSpreadUnchanged, 'triggerUnchangedInScope should trigger')
  const { keys } = getFromMap(reactiveToPayloads, toRaw(source), createPayload)
  // 剩下的都是真正改变过的
  // collection being cleared, trigger all effects for target
  // 触发所有依赖于此 indep 的 computation
  const next = []
  keys.forEach(({ computations }) => {
    computations.forEach(computation => {
      if (computation.scopeId === scopeId) {
        const nextSource = toRaw(computation.computed)
        next.push(nextSource)
      }
    })
  })
  next.forEach(nextSource => triggerUnchangedInScope(nextSource, scopeId))
}


/****************************************
 * Utilities
 *****************************************/
/**
 * CAUTION
 * 这里的 replace 并没有做深度比较，只有 trigger 在触发时做了最浅的比较。
 * 所以如果某个 computed 依赖另一个 computed 对象上的属性，并且属性还是一个对象，
 * 那么不管是不是深度相同，都会被触发。
 *
 * 目前没有改进计划，因为在实际应用中，视图层已经有 dom diff 来过滤到没有变化的情况。
 * 也可以认为目前没有看到 computed 依赖造成的性能消耗问题很大的情况。
 */
export function replace(source, nextSourceValue) {
  if (isRef(source)) {
    source.value = nextSourceValue
  } else if (Array.isArray(source)){
    source.splice(0, source.length, ...nextSourceValue)
  } else {
    const nextKeys = Object.keys(nextSourceValue)
    const keysToDelete = Object.keys(source).filter(k => !nextKeys.includes(k))
    keysToDelete.forEach(k => delete source[k])
    Object.assign(source, nextSourceValue)
  }
}

let scopeIdToSkip = null
function skipScope(id) {
  scopeIdToSkip = id
  return function stopSkip() {
    scopeIdToSkip = null
  }
}


export function createPayload() {
  return {
    keys: new Map()
    // computation 不一有，只有 computed 才有。
  }
}

function createKeyNode(indep) {
  return {
    indep,
    computations: new Set()
  }
}

/**
 * mutation cache TODO
 */


/**
 * subscribe
 * 需求：
 * 1. trigger 的时候如果发现当前 keyNode 上没有 sync 标记。
 * 那么就把所有 computation 对应的 computed，以及之后的 computed，全部标记为 dirty，不计算。
 * 遇到已经标记过了的就不用标记了。
 * 2. 如果发现自己有 sync 标记那么就正常触发一切。
 *
 */


export function findIndepsFromDep(dep, candidatesIndexByName) {
  const { computation } = getFromMap(reactiveToPayloads, toRaw(dep))
  if ( !computation ) return {}

  const indeps = new Set()
  computation.indeps.forEach(keyNode => {
    indeps.add(keyNode.indep)
  })
  const matchedCandidates = {}
  const unmatchedCandidates = {}
  Object.entries(candidatesIndexByName).forEach(([name, candidate]) => {
    const rawCandidate = toRaw(candidate)
    if (indeps.has(rawCandidate)) {
      matchedCandidates[name] = candidate
      indeps.delete(rawCandidate)
    } else {
      unmatchedCandidates[name] = candidate
    }
  })
  // 都是没命中的。继续找
  indeps.forEach((indep) => {
    Object.assign(matchedCandidates, findIndepsFromDep(indep, unmatchedCandidates))
  })

  return matchedCandidates
}


export function findDepsFromIndep(indep, candidatesIndexByName) {
  const { computation } = getFromMap(reactiveToPayloads, toRaw(dep))
  if ( !computation ) return {}

  const indeps = new Set()
  computation.indeps.forEach(keyNode => {
    indeps.add(keyNode.indep)
  })
  const matchedCandidates = {}
  const unmatchedCandidates = {}
  Object.entries(candidatesIndexByName).forEach(([name, candidate]) => {
    const rawCandidate = toRaw(candidate)
    if (indeps.has(rawCandidate)) {
      matchedCandidates[name] = candidate
      indeps.delete(rawCandidate)
    } else {
      unmatchedCandidates[name] = candidate
    }
  })
  // 都是没命中的。继续找
  indeps.forEach((indep) => {
    Object.assign(matchedCandidates, findIndepsFromDep(indep, unmatchedCandidates))
  })

  return matchedCandidates
}

function markAsSync(start, id, isSource) {
  // 1. 已经有了 sync 标记
  // 2. 没有 sync 标记
  // 1. 找到 computation -> key，把 computation 移动到 keyNode.syncComputation 中。继续把所有 indep 的 computation 都移动到 indepComputation 中。

  const payload = getFromMap(reactiveToPayloads, start)
  // 如果当前节点已经是 sync 了
  if (!payload.syncIds) payload.syncIds

  if (!payload.computation) return

  payload.computation.indeps.forEach(keyNode => {

  })
}