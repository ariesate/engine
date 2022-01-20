import {
  createIdGenerator,
  insertIntoOrderedArray,
  filterOut,
  isPlainObject,
  isNaiveValue,
  typeEqual,
  isCollectionLike
} from './util';
import {invariant, tryToRaw} from '../util';
import { isAtom, reactive, atom, toRaw } from './reactive';
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
 * (source|computed) <-indep[1:n]$$payload.keys-> key <-indeps[n:n]computations-> computation <-$$payload.computation[1:1]computed-> computed
 *
 * source|computed: Reactive
 *   - $$payload.keys: Map<keyName, key>
 *   - $$payload.computation : ?Computation  只有 computed 才有这个字段
 *
 * key: KeyNode
 *   - key: key name
 *   - indep: Reactive
 *   - computations: Set<Computation>
 *
 * computation: Computation
 *   - indeps: Set<Key>
 *   - computed: Reactive
 *   - scopeId: scopeId 用来标记中间变量的。目前用于 derive 中。
 *   - levelParent: 用来记录自己当前认识的最长路径的 parent。
 *   - levelChildren: 用来记录把自己当做最长路径 parent 的 children。当自己发生变化时，要 children 自己重新选择一下 parent。
 *   - level: 记录计算出来的层级
 *
 * 内存模型：
 * CAUTION computed 的销毁需要外部主动执行 destroyComputed(computed)。否则会一直在内存中。
 */

/****************************************
 * Computed
 ****************************************/
export const TYPE = {
  REF: Symbol('ref'),
  TOKEN: Symbol('token')
}

export function isComputed(obj) {
  if (!obj) return false
  const payload = getFromMap(reactiveToPayloads, toRaw(obj))
  return payload && payload.computation
}

export function atomComputed(computation) {
  return createComputed(computation, TYPE.REF)
}

class ComputedToken {}

/*
 * CAUTION 在 computed 中应该是不允许再嵌套 reactive，
 *  因为每次就算都会导致原本的 reactive 引用丢失。
 * TODO 在 dev 环境下检测是否有嵌套的 reactive
 *
 * TODO computed 要限制只能用 computation 修改，不能用户修改。
 *
 * 第三参数表示如果是复杂 computed 对象，是否不进行深度 patch，默认是进行。
 */
export function createComputed(computation, type, shallow) {
  invariant(typeof computation === 'function', 'computation must be a function')

  computation.computed = type ? (type === TYPE.REF ? atom(undefined, true) : new ComputedToken()) : undefined
  computation.indeps = new Set()
  computation.levelChildren = new Set()
  computation.level = 0
  computation.type = type
  computation.deep = shallow
  // 用来标记 scope 的，后面可以用 scopeId skip 掉计算过程。
  computation.scopeId = activeScopeId

  // 执行 compute 的时候会 track 依赖。
  compute(computation)

  // 如果是第一次 compute 里面会判断 computation 没有 computed，那么会根据 computation 类型自动建立 ref 或者 reactive
  const payload = getFromMap(reactiveToPayloads, toRaw(computation.computed), createPayload)
  payload.computation = computation

  applyCollectComputed(computation.computed)
  return computation.computed
}

function applyCollectComputed(computed) {
  // 1. 看有没有收集的需要
  if (!computedCollectFrame.length) return

  const collectFrame = computedCollectFrame[computedCollectFrame.length - 1]
  // 2. 如果当前 computation 是在另一个 computation 里面，即 computed 里面的 computed。
  // 但是收集的 frame 并没有需求收集，那么就 return。
  // 通常收集都是为了主动销毁，inner computed 一般不用收集，因为 computed 本身就会记录自己内部的 computed，自己重新计算的时候会销毁掉之前的。所以没有进行外部收集进行销毁的需求。
  if (computationStack.length && !collectFrame.includeInner ) return
  // 3. 是第一层，或者不是第一层但标记了 includeInner ，那么收集一下
  collectFrame.computed.push(computed)
}

export function destroyComputed(computed) {
  const payload = getFromMap(reactiveToPayloads, toRaw(computed))
  if (payload) {
    invariant(Object.values(payload.keys).every(({ computations }) => computations.size === 0), 'computed have deps, can not destroy')
    const { computation } = payload
    if (computation) {
      delete computation.scopeId
      delete computation.type
      delete computation.computed
      // 清理 computation 和前面的依赖
      computation.indeps.forEach(keyNode => {
        keyNode.computations.delete(computation)
      })
      delete computation.indeps

      // 断开连接
      if (computation.levelParent) {
        computation.levelParent.levelChildren.delete(computation)
      }

      // 最后标记一下，可以用于调试等
      computation.deleted = true
    }
    reactiveToPayloads.delete(toRaw(computed))
  } else {
    console.warn('object is not computed or already destroyed')
  }

}


/****************************************
 * Computation
 ****************************************/

/* TODO 最后的 replace 和 deepPatch 都是既是用来修改数据，也是用来再出发 computed 上的依赖的。
 * 对于"数组"这种可变索引的数据类型来说，用户如果没有"具名"的路径依赖，就不需要 deepPatch。
 * 具名指的是 arr[1].xxx 这样的，其中 1 就是具体的索引。
 * 一般情况下都是使用 arr.map/forEach。这个时候其实都只是坚挺了 iteration，只要出发 iteration 的依赖冲计算就够了。
 */

function applyComputation() {
  const { computation } = computationStack[computationStack.length - 1]
  const isToken = computation.computed instanceof ComputedToken
  // TODO 似乎没有必要，由外部 traverse 就好了，而且还没有考虑深度的情况。
  function watchAnyMutation(source) {
    track(toRaw(source), TrackOpTypes.ANY, ANY_KEY)
  }
  startTracking()
  const nextValue = computation(tryToRaw(computation.computed), watchAnyMutation)
  stopTracking()
  // 第一创建的时候，如果用户没有指定类型，那么就要让框架来根据类型自动创建
  if (computation.computed === undefined) {
    computation.computed = (Array.isArray(nextValue) || isPlainObject(nextValue)) ? reactive(nextValue, true) : atom(nextValue, true)
  } else if(!isToken) {
    // 未来可能提供能力让 computed token 可以销毁自己。所以这里的 isToken 变量要在前面定义，否则到这里的时候 computation 已经被清理得差不多了
    if (computation.type === TYPE.REF || computation.shallow) {
      // TODO 支持自定义的 patch???
      replace(computation.computed, nextValue)
    } else {
      deepPatch(computation.computed, nextValue)
    }
  }
}


/**
 * compute 的执行时机：
 * 1. createComputed。第一次建立联系，此时可能出现 computed 中再创建 computed，computationStack 中已有值。
 * 2. digestComputations。compute 中再触发的 computation 只会加入到 digest 尾部。因此 computationStack 只会有一个。
 */
function compute(computation) {
  invariant(!computationStack.find(({computation: c}) => c === computation ), 'recursive computation detected')
  computationStack.push({computation, indeps: new Set()});
  try {
    // computed 里面可以在创建 computed，我们在重新计算之前要清理一下。
    destroyInnerComputed()
    // 会从 computationStack 中读当前的 frame，所以不用传值。
    // 到 compute 的时候一定已经在一个 computations running 周期里了。里面的再触发的加到了队列末尾
    applyComputation()
    const indepsChanged = patchComputation()
    // 可能创建子的 computed，这个关系记录一下
    updateComputedRelation()

    // 这里做这个判断可以优化性能。
    if (indepsChanged || hasInnerComputed(computation)) {
      // 可以更新 level 了，我们的 compute 也是洋葱模式，最里层的 computed 先计算。
      updateLevelParent(computation)
    }
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

  let indepsChanged = false
  computation.indeps = nextIndeps
  computation.indeps.forEach(keyNode => {
    if (!prevIndeps.has(keyNode)) {
      // 新增的
      keyNode.computations.add(computation)
      indepsChanged = true
    } else {
      // 原来就有的，这次还有
      prevIndeps.delete(keyNode)
    }
  })
  // 最后 prevIndeps 里面还剩下的就是要删除的
  prevIndeps.forEach(toRemoveKeyNode => {
    toRemoveKeyNode.computations.delete(computation)
    indepsChanged = true
  })
  return indepsChanged
}

function updateLevelParent(computation, nextParentLevel) {
  // 如果有 nextParentLevel 并且是增大了，说明只要更新一下自己就行了，如果不是就要全部重新计算出最大的。
  if (nextParentLevel && computation.level < nextParentLevel + 1) {
    computation.level = nextParentLevel + 1
    return
  }

  // 所有 computation level 默认是 1
  let maxParentLevel = -1
  let levelParent
  computation.indeps.forEach(keyNode => {
    // 能不能确保indeps 的level 都是正确的呢？如果每次修改都保证通知后面的话，那么就能保证。
    const parentComputation = getComputationFromKeyNode(keyNode)
    if (parentComputation && parentComputation.level > maxParentLevel) {
      maxParentLevel = parentComputation.level
      levelParent = parentComputation
    }
  })


  // 还要看所有的内部 computed 的高度
  const innerComputations = computedRelation.get(computation)
  if (innerComputations) {
    innerComputations.forEach(innerComputation => {
      if (innerComputation.level && innerComputation.level > maxParentLevel) {
        maxParentLevel = innerComputation.level
        levelParent = innerComputation
      }
    })
  }


  // 所有的 indeps 都是 reactive，那么 levelParent 就不存在，所以这里有个判断。
  if (levelParent) {
    if (computation.levelParent !== levelParent) {
      // 不要忘了从原来的地方删掉自己
      if (computation.levelParent) computation.levelParent.levelChildren.delete(computation)
      // 建立新的链接
      computation.levelParent = levelParent
      levelParent.levelChildren.add(computation)
    }
  }

  // 注意，一个 computation 是有可能计算多次，但这是必须的。
  // 比如 a 依赖了 b、c，同时 c 也依赖了 b。那么 b 的高度会引起 a 变化，导致 a 选择 c。
  // 然后 b 的变化也引起了 c 的变化，c 也要 a 重新计算一下才能达到稳定。
  if (computation.level !== maxParentLevel + 1) {
    computation.level = maxParentLevel + 1
    // 只在 digest 的时候标记一下，如果这个 computation 已经在队列了，那么可能要重新排序。平时不需要标记，比如创建的时候。
    // 还要考虑可能
    if (inComputationDigestion && !levelChangedComputations.includes(computation)) {
      levelChangedComputations.push(computation)
    }
    // 继续通知后辈，每次都保证 level 是稳定的
    computation.levelChildren.forEach(levelChild => updateLevelParent(levelChild), computation.level)
  }
}

function getComputationFromKeyNode(keyNode) {
  const payload = getFromMap(reactiveToPayloads, toRaw(keyNode.indep))
  if (payload) {
    return payload.computation
  }
}

/**
 * 因为我们的 computed 中允许再建立 computed。
 * 这意味每次 computed 重新执行的时候都会新建，所以必须要清理掉上次的子 computed。否则会造成内存泄露。
 */
function destroyInnerComputed() {
  const { computation } = computationStack[computationStack.length - 1]
  // 先清理掉依赖于当前项 computed
  let current
  const computationToClear = computedRelation.get(computation)
  if (computationToClear) {
    const computedToDestroy = []
    while(current = computationToClear.shift()) {
      // 销毁
      computedToDestroy.push(current.computed)
      // 再把更里面的也放进去等着销毁
      computationToClear.push(...(computedRelation.get(current) || []))
    }
    computedToDestroy.forEach(computed => {
      destroyComputed(computed)
    })
  }
}

function updateComputedRelation() {
  // 建立自己和 parent 的关系。 <2 说明没有自己不是在别的 computed 中创建的。
  if (computationStack.length < 2) return

  const { computation } = computationStack[computationStack.length - 1]
  const { computation: outerComputation } = computationStack[computationStack.length - 2]
  if (outerComputation) {
    let inner = computedRelation.get(outerComputation)
    if (!inner) computedRelation.set(outerComputation, (inner = []))
    if (!inner.includes(computation)) inner.push(computation)
  }
}

function hasInnerComputed() {
  const { computation } = computationStack[computationStack.length - 1]
  return computedRelation.get(computation) && computedRelation.get(computation).length
}

// 用来记录 digest 后要执行的回调，这些回调通常在 digest 过程中红产生，这样就可以让回调脱离 compute。
// 回调里不能再触发 digest，不然可能出现循环
let inDigestionCallback = false
const digestionCallbacks = []
export function afterDigestion(callback) {
  if (!digestionCallbacks.includes(callback)) {
    digestionCallbacks.push(callback)
  }
}

// 用来注册 computation 的 observer，通常是 devtools 用。
// observer 是个对象，可以设置 start/compute/end 三个回调，分别对应 digestion 执行前，中，后。
const computationObservers = new Set()
export function observeComputation(observer) {
  computationObservers.add(observer)
  return () => {
    computationObservers.delete(observer)
  }
}

// reactive 变化时 trigger 的多个 computed 都会先一起存在 cachedComputations 里面，然后一起计算。
// 在 computed 计算中继续触发的依赖 computed ，也会不断插入到 cachedComputations 中。
// 这个对象暴露出去，可以给 devtools 等工具用来做监控，或者查询
export const cachedComputations = []
export const cachedTriggerSources = new Set()
let inComputationDigestion = false
// 用来临时记录在 computation 中改变了层级的
let levelChangedComputations = []
// 用来记录在一次 digestion 中发生了变化的 computation，
const appliedComputations = new Set()
const maxComputationCalls = 10000
let computationCalled = 0
function digestComputations() {
  invariant(!inComputationDigestion, 'already in computation digestion')
  invariant(!inDigestionCallback, 'in digestion callback loop, should not trigger digest')
  inComputationDigestion = true
  let computation
  computationObservers.forEach(observer => observer.start && observer.start(cachedTriggerSources, cachedComputations))
  computationCalled = 0
  while(computation = cachedComputations.shift()) {
    // 一定不要忘了清空
    levelChangedComputations = []
    // 通知全局的 observer,observer 可以自己去 cachedComputations 取后续的，去 appliedComputations 中取执行过的。
    computationObservers.forEach(observer => observer.compute && observer.compute(computation, appliedComputations, cachedTriggerSources, cachedComputations))
    compute(computation)
    appliedComputations.add(computation)
    // 产生了层级变化的 computation， 要重新排序。level 低的排前面。
    // 绝大部分场景，应该不会有层级频繁变化的 computation。
    const changedLevelComputations = filterOut(cachedComputations, levelChangedComputations)
    changedLevelComputations.forEach(c => {
      insertIntoOrderedArray(cachedComputations, c, (a, b) => b.level < a.level)
    })
    computationCalled++
    if (computationCalled > maxComputationCalls) {
      console.error(`computation called more than ${maxComputationCalls}, seems like infinite loop`)
      cachedComputations.splice(0, cachedComputations.length)
      break
    }
  }
  // 这个对象只是给 observer 用，执行完就要清空。
  computationObservers.forEach(observer => observer.end && observer.end(appliedComputations, cachedTriggerSources))
  appliedComputations.clear()
  cachedTriggerSources.clear()
  inComputationDigestion = false
  inDigestionCallback = true
  let callback
  while(callback = digestionCallbacks.shift()) {
    callback()
  }
  inDigestionCallback = false
}

function isValidComputation(computation) {
  return typeof computation === 'function' && computation.computed !== undefined && !computation.indeps !== undefined &&!computation.deleted
}

/**
 * computation 有一个层级字段，表示当前 computed 到 source 的最长路经。
 * 我们把小层级的 computation 放到前面计算，大的放大后面，因为小层级计算的后可能会加入新的 computation，
 * 这时加入的 computation 就可能是和谋面的一样的，这时就能跳过了。
 */
function scheduleToRun(computations, source) {
  // 注意，因为对象形式的 computed 在更新的时候是使用的是 deepPatch，
  const { computation: currentComputation } = computationStack[computationStack.length -1] || {}
  computations.forEach(c => {
    if (currentComputation === c) {
      console.warn(`recursive compute detected, something wrong with dep collector`)
    }

    if (!isValidComputation(c)) {
      console.error(`invalid computation`, c)
    } else if (currentComputation !== c && !shouldSkipComputation(c) && !cachedComputations.includes(c)) {
      insertIntoOrderedArray(cachedComputations, c, (a, b) => b.level < a.level)
    }
  })
  cachedTriggerSources.add(source)
  if (!inComputationDigestion && !debounced) {
    digestComputations()
  }
}

/**
 * cache:
 * 在一个连续的过程中，可以进行多次 source 的操作，这些操作可能引发相同的 computed 计算，
 * 使用 cache，能将这些 computed 的计算合并到整个过程的最后。
 * 注意，在这个连续的过程中，如果出现了要读取 computed 的情况，会自动触发该 computed 所有依赖的计算。
 *
 * 不采用 dirty 字段标记，因为我们的依赖链，是一种"可能的"依赖。具体会不会影响后辈，是要靠 computed 重新计算才知道的。
 * 所以只要中途读了 computed，就直接应用所有计算。
 */
let debounced = false
export function debounceComputed(operation) {
  // 已经在 debounce 中了，直接执行就行
  if (debounced) return operation()

  debounced = true
  // TODO 如果遇到了读 computed 就要去掉 debounced，直接开始执行
  let error
  try {
    operation()
  } catch( e ) {
    error = e
  } finally {
    debounced = false
  }

  if (error) throw error

  if (!inComputationDigestion) digestComputations()
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

let shouldTrack = false;

export function startTracking() {
  shouldTrack = true;
}

export function stopTracking() {
  shouldTrack = false;
}

export function track(indep, type, key) {

  const frame = computationStack[computationStack.length -1]
  // CAUTION 不能读自己，哪怕能达到稳定态也不行
  if (!shouldTrack || !frame || indep === toRaw(frame.computation.computed)) {
    return;
  }
  // CAUTION 不能 track ComputedToken，如果有这种情况，很可能程序写错了
  invariant(!(indep instanceof ComputedToken), 'cannot track computedToken')
  const payload = getFromMap(reactiveToPayloads, toRaw(indep), createPayload)
  const keyNode = getFromMap(payload.keys, key, () => createKeyNode(indep, key))
  frame.indeps.add(keyNode)
}


// CAUTION 过滤掉要 skip 的 computation。 这个标记先打在 computation 上。这是专门给 inverseComputed 用的。
function shouldSkipComputation(computation) {
  return scopeIdToSkip && (computation.scopeId === scopeIdToSkip)
}

/**
 * 用来检测任何 trigger 的，通常是 devtools 或者第三方使用
 */
const triggerObservers = new Set()
export function observeTrigger(observer) {
  triggerObservers.add(observer)
  return () => {
    triggerObservers.delete(observer)
  }
}

export function trigger(source, type, key, extraInfo) {
  // 当 type === type === TriggerOpTypes.SET 时，extraInfo 是个 bool， 用来表示数据是不是没变化。
  // 执行了赋值操作，但数据没变，外部可以要求仍然触发 trigger。
  // derive 中需要追踪某个数据改变后，所有可能影响的数据，用于保持一致性。所以用 trigger，外部继续监听的方式来找到所有可能影响的。
  if (type === TriggerOpTypes.SET && extraInfo === true) {
    if (scopeIdToSpreadUnchanged) triggerUnchangedInScope(source, scopeIdToSpreadUnchanged)
    return
  }

  // 不要直接使用 scheduleToRun, 因为会直接执行。
  // 在一个对象的 trigger 中，依赖的 computed 也会有层级关系。因此这里要一起插进去，利用
  //系统的排序能力保证顺序是正确的
  const computationsToRun = new Set()
  const { keys } = getFromMap(reactiveToPayloads, toRaw(source), createPayload)
  // 剩下的都是真正改变过的
  if (type === TriggerOpTypes.CLEAR /* CLEAR */) {
    // collection being cleared, trigger all effects for target
    // 触发所有依赖于此 indep 的 computation
    keys.forEach(({ computations }) => {
      computations.forEach(computation => computationsToRun.add(computation))
    });
  } else {
    // SET | ADD | DELETE 触发依赖于相应的 key 的 computation
    if (key) {
      const { computations } = getFromMap(keys, key, () => createKeyNode(source, key))
      computations.forEach(computation => computationsToRun.add(computation))
    }
    // 如果触发了长度变化(add|delete)，那么还要触发监听了 length 或进行过遍历的 computed
    if (type === "add" /* ADD */ || type === "delete" /* DELETE */) {
      // length/ITERATE_KEY 都要，即使是数组，Object.keys 也是触发的 ITERATE_KEY。
      if (Array.isArray(source)) {
        const { computations } = getFromMap(keys, 'length', () => createKeyNode(source, 'length'))
        computations.forEach(computation => computationsToRun.add(computation))
      }
      const { computations: iterateComputations } = getFromMap(keys, ITERATE_KEY, () => createKeyNode(source, ITERATE_KEY))
      iterateComputations.forEach(computation => computationsToRun.add(computation))
    }
  }

  // 把 any 取出来
  const { computations : anyComputations} = getFromMap(keys, ANY_KEY, () => createKeyNode(source, ANY_KEY))
  anyComputations.forEach(computation => computationsToRun.add(computation))

  if (computationsToRun.size) {
    scheduleToRun(Array.from(computationsToRun), source)
  }

  // CAUTION 如果需要 debounce，外部自己去做
  if (triggerObservers.size) {
    triggerObservers.forEach(callback => callback())
  }
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

/**
 * 直接应用所有的 sourceMutation 和 depsMutation。
 * 通过 skip 来断掉中间的链式反应。
 * 这是在已知 source 和 deps 能保持一致时的加速方案。
 */
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
  if (isAtom(source)) {
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

function replaceObjectLikeValue(source, nextKey, nextValue) {
  const isMap = source instanceof Map

  // CAUTION 只有当 nextValue 不是来自别的地方的 reactive 引用，并且新 value 和老 value 都是同类型的 collection，
  // 才继续 deepPatch。
  if (!isReactiveLike(nextValue) && typeEqual(nextValue, source[nextKey]) && isCollectionLike(nextValue)  ) {
    deepPatch(isMap ? source.get(nextKey) : source[nextKey], nextValue)
  } else {
    // Map/Array/Object || nextValue 已经是 reactive，或说明是来自别的地方的引用。
    if (isMap) {
      source.set(nextKey, nextValue)
    } else {
      source[nextKey] = nextValue
    }
  }
}

/**
 * TODO 还需要进一步允许性能优化，比如对象上可以标记"时间戳"，直接通过时间戳来判断是否要进行深度 patch。
 */
export function deepPatch(source, nextSourceValue) {
  invariant(isAtom(source) || typeEqual(source, nextSourceValue), 'computed should always return same type')

  if (isAtom(source)) {
    source.value = nextSourceValue
  } else if (Array.isArray(source)){
    // 先删掉多的
    source.splice(nextSourceValue.length)
    nextSourceValue.forEach((nextValue, index) => {
      replaceObjectLikeValue(source, index, nextValue)
    })
  } else if (isPlainObject(nextSourceValue)){
    const nextKeys = Object.keys(nextSourceValue)
    const keysToDelete = Object.keys(source).filter(k => !nextKeys.includes(k))
    // 先删掉多余的
    keysToDelete.forEach(k => delete source[k])
    nextKeys.forEach(nextKey => {
      const nextValue = nextSourceValue[nextKey]
      replaceObjectLikeValue(source, nextKey, nextValue)
    })
  } else if (source instanceof Map) {
    // TODO 这里其实也没法，因为 key 可能是对象，引用会变。
    const nextKeys = Array.from(nextSourceValue.keys())
    const keysToDelete = Array.from(source.keys()).filter(k => !nextKeys.includes(k))
    // 先删掉多余的
    keysToDelete.forEach(k => source.delete(k))
    nextKeys.forEach(nextKey => {
      const nextValue = nextSourceValue.get(nextKey)
      replaceObjectLikeValue(source, nextKey, nextValue)
    })
  } else if (source instanceof Set) {
    // CAUTION Set 没法深度
    source.forEach(s => {
      if (!nextSourceValue.has(s)) source.delete(s)
    })
    nextSourceValue.forEach(n => {
      if (!source.has(n)) source.add(n)
    })
  } else {
    invariant(false, 'unknown computed value')
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

function createKeyNode(indep, key) {
  return {
    indep,
    key,
    computations: new Set()
  }
}

/**********************
 * Cache computed mutation
 **********************/

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

export function getComputation(computed) {
  const payload = getFromMap(reactiveToPayloads, toRaw(computed))
  return payload ? payload.computation : undefined
}

/**
 * 收集一个 operation 执行中产生的 computed，因为我们的 computed 会一直在 dep 链上，外部丢失引用也不会消失，需要主动销毁。
 * 所以外部收集，然后执行销毁很重要。
 *
 * 如果用户想要收集某个操作中的创建的 computed。
 * 可以通过第二个参数指定是否要收集 computed 里面再创建的。
 * 注意如果在 operation 中又出现了 collectComputed，那么上层的 frame 收集不到里面的。
 */
const computedCollectFrame = []
export function collectComputed(operation, includeInner = false) {
  const frame = { includeInner, computed: []}
  computedCollectFrame.push(frame)

  let error
  // 执行
  try{
    operation()
  } catch(e) {
    error = e
  } finally {
    computedCollectFrame.pop()
  }

  if (error) throw error

  return frame.computed
}

export function isCollectingComputed() {
  return computedCollectFrame.length !== 0
}

/**
 * 通过 computed 或者 computation 来获取整个 indep tree.
 * 目前提供给 devtools 用。
 *
 * 构建树。这个树的结构是:
 * [
 *  {
 *    object: 依赖的 reactive 对象。外界获取后可以查看值。必须得是 raw，不然读的过程中可能造成 track 的问题。
 *    keys: 依赖对象的 key
 *    indeps: []，该对象的依赖，只有 computed 才会有。
 *    computation：该对象的 computation，只有 computed 才有。可以用 debug(computation) 来 debug 或者 inspect 到源码。
 *  }
 * ]
 *
 *
 */
export function getIndepTree(computation, handle, seen = new WeakMap(), refRaw= new WeakMap) {
  // TODO 如果这个 computed 是某个 computed 对象的局部，name就没有 computation

  const resultContainer = []

  computation.indeps.forEach(({ indep, key }) => {
    // tryToRaw 对 ref 会创建新对象，因此要自己记录一下
    let rawObject
    if (isAtom(indep)) {
      if (!refRaw.has(indep)) refRaw.set(indep, tryToRaw(indep))
      rawObject = refRaw.get(indep)
    } else {
      rawObject = tryToRaw(indep)
    }

    // 一个对象可能依赖另一个对象的多个 key。
    // 我们把按照 key 来组织的 indep 改成按照 indep 来组织的，key 都放到 keys 里面
    let indepInfo = resultContainer.find(({ object }) => object === rawObject)
    if (!indepInfo) resultContainer.push((indepInfo = {
      indep,
      object:
      rawObject, keys: [],
      computation: getComputation(indep)
    }))

    indepInfo.keys.push(key)

  })

  // 加载子 indep
  resultContainer.forEach(indepInfo => {

    if (seen.has(indepInfo.object)) {
      indepInfo.indeps = seen.get(indepInfo.object).indeps
    } else if (isComputed(indepInfo.indep)) {
      const indepComputation = getComputation(indepInfo.indep)
      // 可能没有，例如依赖的 indep 只是某个 computed 对象的局部
      if (indepComputation) {
        indepInfo.indeps = getIndepTree(indepComputation, handle, seen, refRaw)
      } else {
        console.warn('did not find computation for', indepInfo.object)
        // TODO 这里有个溯源到 root 的问题。
      }
    }
    // 剩下来的就是 source reactive 了。

    // 记录一下，如果其他 indeps 也有同样的依赖，就不用处理了。生成的树上会有
    seen.set(indepInfo.object, indepInfo)
    // CAUTION 一定要 delete，防止读操作扰乱了 track
    handle(indepInfo)
  })

  // 可以增加些别的信息，例如给对象打上个 id, name 用来标记。
  return resultContainer
}
