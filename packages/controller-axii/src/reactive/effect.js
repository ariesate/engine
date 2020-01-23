import { createIdGenerator } from './util';
import { invariant } from '../util';
import { isRef, reactive, ref, toRaw } from './reactive';
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { isReactiveLike } from './index';

const computationStack = [];
let tempComputationIndeps = new Set()

const reactiveToPayloads = new WeakMap()
const reactiveToListeners = new WeakMap()


export let activeComputation;
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
 */

/****************************************
 * Computed
 ****************************************/
const TYPE = {
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

function createComputed(computation, type) {
  invariant(typeof computation === 'function', 'computation must be a function')
  const computed = type === TYPE.REF ? ref(undefined) : reactive( type === TYPE.OBJECT ? {} : [])
  const payload = getFromMap(reactiveToPayloads, toRaw(computed), createPayload)
  payload.computation = computation

  computation.computed = computed
  computation.indeps = new Set()
  computation.type = type
  // 用来标记 scope 的，后面可以用 scopeId skip 掉计算过程。
  computation.scopeId = activeScopeId
  // 这是在创建，第一次跑的时候什么都不要 track。
  compute(computation)
  return computed
}

/****************************************
 * Computation
 ****************************************/

function applyComputation(computation) {
  function watchAnyMutation(source) {
    track(toRaw(source), TrackOpTypes.ANY, ANY_KEY)
  }

  const nextValue = computation(watchAnyMutation)
  replace(computation.computed, nextValue)
}


/**
 * 逆运算的实现：
 * computation 是由某几个 source 某个字段引起的引起的，可以通过 computation 的 keyNode 反向查到。
 * 当有一个数据是 Reverse(computation, computedValue)，并且要执行 computation 时。
 * 1. 执行 computation, 就直接取值，不用算了。
 * 2. 把对应 Reverse(computation, computedValue) source[key] 的值算出来，替换掉(暂停 trigger)。
 *
 * 如果一个 computation 的多个 indep(keyNode) 对应的值都是 Reverse(computation, computedValue)。
 * 那么应该取最后一个。
 */
function compute(computation) {
  invariant(!computationStack.includes(computation), 'recursive computation detected')
  invariant(!tempComputationIndeps.size, 'something wrong, track container not empty')
  try {
    computationStack.push(computation);
    activeComputation = computation;
    // 到 compute 的时候一定已经在一个 computations running 周期里了。里面的再触发的加到了队列末尾
    applyComputation(computation);
    patchComputation(computation, tempComputationIndeps)
  }
  catch(e) {
    console.error(e)
  }
  finally {
    tempComputationIndeps = new Set()
    computationStack.pop();
    activeComputation = computationStack[computationStack.length - 1];
  }
}

// 清理之前的 indeps
function patchComputation(computation, nextIndeps) {
  const { indeps: prevIndeps } =  computation

  computation.indeps = nextIndeps
  computation.indeps.forEach(keyNode => {
    if (!prevIndeps.has(keyNode)) {
      // 新增的
      keyNode.computations.add(activeComputation)
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
  // console.log("scheduleTorun", computations.size, computations, inComputationDigestion)
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
  // CAUTION 应该不能读自己，哪怕能达到稳定态也不行
  if (!shouldTrack || activeComputation === undefined || indep === toRaw(activeComputation.computed)) {
    return;
  }
  const payload = getFromMap(reactiveToPayloads, toRaw(indep), createPayload)
  const keyNode = getFromMap(payload.keys, key, () => createKeyNode(indep))
  tempComputationIndeps.add(keyNode)
}



// CAUTION 过滤掉要 skip 的 computation。 这个标记先打在 computation 上。这是专门给 inverseComputed 用的。
function shouldSkipComputation(computation) {
  return scopeIdToSkip && (computation.scopeId === scopeIdToSkip)
}

function callListener(source, isUnchanged) {
  const listeners = getFromMap(reactiveToListeners, source)
  if (listeners) listeners.forEach(listener => listener(isUnchanged))
}

export function trigger(source, type, key, extraInfo) {
  // 数据没变的情况
  if (type === TriggerOpTypes.SET && extraInfo ) {
    if (scopeIdToSpreadUnchanged) triggerUnchangedInScope(source, scopeIdToSpreadUnchanged)
    return
  }

  // 先触发自己的 subscribe。
  callListener(source)

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

export function computeScope(scopeId, sourceMutation, depsMutation) {
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
        callListener(nextSource, true)
        next.push(nextSource)
      }
    })
  })
  next.forEach(nextSource => triggerUnchangedInScope(nextSource, scopeId))
}


/****************************************
 * Utilities
 *****************************************/

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


const genSubscribeId = createIdGenerator()

export function subscribe(obj, listener) {
  invariant(isReactiveLike(obj), 'can only subscribe reactive like object')
  const listeners = getFromMap(reactiveToListeners, toRaw(obj), () => new Set())

  if (!listeners.has(listener)) {
    listeners.add(listener)
  }

  return function unsubscribe() {
    listeners.delete(listener)
  }
}


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