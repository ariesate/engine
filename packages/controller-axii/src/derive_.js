import { getCurrentWorkingCnode } from './renderContext'
import { filter, invariant, mapValues, createCacheContainer } from './util';
import {
  isReactiveLike,
  reactive,
  ref,
  toRaw,
  startScope,
  isRef,
  unsafeComputeScope,
  replace,
  findIndepsFromDep,
  spreadUnchangedInScope
} from './reactive';
import { applyPatch, createDraft, finishDraft } from './produce';

/**
 * 1. 将 props 和 state 间的关系通过 computed 建立起来
 * 2. 对 state 的修改触发的 props change 表达成 reverseComputed(stateResult, maybePropResult) 类型
 * 3. props 接收到 reverseComputed(stateResult, maybePropResult) 以后再触发 props -> computed。compute+reverseComputed(stateResult) 直接得到 stateResult。
 *    中间的 过程computed 的计算可以全部跳过。通过 derive 这个函数作为标记。
 * 4. props 如果被订阅了 reverseComputed 或者 maybePropResult 存在就直接求值，否则可以一直存着，被用到时再求值。
 *
 * 这样整个系统里面也不需要 effect 了，只有 source 和 computed。
 *
 * // scrollTop 之类的怎么处理？
 * $scrollTop = reactive((v) => {
 *    // debounce 可以在这里自己处理。
 *   const stop = window.addxxx((xxxx) => {
 *     v.value = xxxx
 *   })
 *   return function dispose() {
 *     stop()
 *   }
 * }, 0)
 *
 *
 * draft 的实现：
 * [input, draft] => finalShowValue。
 * 当在组件要显示 draft 时，显示的其实是 finalShowValue。
 * 对 draft 修改时，存着的数据是 reverseComputed(nextValue, now())
 * compute 在计算时会对比 input 和 draft 的时间，决定显示哪个。
 *
 * 所以我们的 computed 要实现一种自定义类型：
 * 用户动态决定是重新跑一遍 computed， 还是直接取值。
 */

const cnodeToPropsFromStateFnMap = new WeakMap()

function getComputedProp(cnode, propName, state) {
  const result = cnodeToPropsFromStateFnMap.get(cnode)[propName](state)
  return (typeof result === 'object') ? result : { value: result }
}

export function createCacheablePropsProxyFromState(props, mutatedState, cnode, container) {
  const fnMap = cnodeToPropsFromStateFnMap.get(cnode) || {}
  const stateDerivedPropNames = Object.keys(fnMap)

  return new Proxy({}, {
    get(target, propName) {
      if (!stateDerivedPropNames.includes(propName)) return tryToRaw(props[propName])

      if (container.has(propName)) return container.get(propName)
      // TODO 支持 immer 形式的修改
      const result = getComputedProp(cnode, propName, mutatedState)

      // 可能取多次，所以暂存结果
      container.set(propName, result)
      return result
    },
  })
}


const propComputeCacheContainer = createCacheContainer()

function mapToReactive(obj) {
  return mapValues(obj, (value) => (typeof value === 'object' ? reactive(value) : ref(value)))
}

export default function derive(propsToStateFn, propsFromStateFnMap) {
  const [cnode] = getCurrentWorkingCnode()
  cnodeToPropsFromStateFnMap.set(cnode, propsFromStateFnMap)

  cnode.scopeId = startScope(() => {
    // 中间的 computed 全部被标记了 id，之后可以 skip 掉
    // props 到 state 的联系是 computed 实现的。
    cnode.state = propsToStateFn()
  })

  return cnode.state
}

function tryToRaw(obj) {
  return isReactiveLike(obj) ? toRaw(obj) : obj
}


function findPropsToEffect(state, stateChanges, props) {
  const changedStateNames = stateChanges.reduce((result, { path }) => {
    result.add(path[0])
    return result
  }, new Set())

  const result = {}
  changedStateNames.forEach(name => {
    Object.assign(result, findIndepsFromDep(state[name], props))
  })
  return result
}


function watchChangedOnce(scopeId, stateIndexByName, applyChange) {
  const changed = {}
  const unsubscribeList = []
  let inWatch = true
  Object.entries(stateIndexByName).forEach(([name, state]) => {
    unsubscribeList.push(subscribe(state, (isUnchanged) => {
      invariant(inWatch, 'already stop watch')
      changed[name] = state
    }))
  })
  // 由于 state 和 prop 都可能变化，为了保持一致，一切以 Prop 变化为准。所以这里要获取 props 赋值了就一定会影响的 state。
  // 使用 spreadUnchangedInScope 就是为了追踪所有可能影响的 state。
  // 由于 reactive 默认是数据没变，那么即使赋值也不会 trigger，那就获取不到可能会改变的 state。
  spreadUnchangedInScope(scopeId, () => {
    applyChange()
  })

  unsubscribeList.forEach(unsubscribe => unsubscribe())
  inWatch = false
  return changed
}

export function getMutationRunner(cnode, mutateFn) {
  const { props, localProps, state } = cnode
  const valueProps = filter({ ...props, ...localProps }, isReactiveLike)

  return function run(callback) {
    return propComputeCacheContainer.run((cacheContainer) => {
      if (!mutateFn) return callback(valueProps, valueProps)

      const draftState = (state ? createDraft(mapValues(state, tryToRaw)) : undefined)
      const draftProps = (createDraft(createCacheablePropsProxyFromState(valueProps, draftState, cnode, cacheContainer)))
      // 这里不会读，也不会动到 derived props
      mutateFn(draftProps, draftState)
      // 这里可能读 derived props, 也可能会改
      const shouldStopApply = callback(draftProps, valueProps)

      let [nextState, stateChanges] = state ? finishDraft(draftState) : []
      const propsChanges = finishDraft(draftProps)[1]

      if (shouldStopApply) return true

      // TODO props 是 computed 的情况！！！！所有相关的 state 和 props 都不要应用。
      // 动态查询 reactive 是否有 computed 的 indep。如果有，就不能应用。

      // 1. 所有 draft 里面动过的，包括 derived Props，全部通过正常的链式反应来形成一致，
      const changedState = watchChangedOnce(cnode.scopeId, state || {}, () => {
        applyPatch(valueProps, propsChanges)
      })

      if (state) {
        // 2. derived props 中没有动过的，同时找到会影响的 state。进行快捷计算。
        // state 可能已经因为外部对 props 的修改而发生了变化。
        // 这里的设计的设置，是对 draftState 中，没有被 recomputed 过的变化进行快速设置。
        // 1. 外部改变了的 propNames
        const changedPropNames = propsChanges.reduce((result, { path }) => {
          result.add(path[0])
          return result
        }, new Set())

        // 2. 找到其中没有因为 listener 修改而变的，这就是要设置的 props。
        const propsToEffectIndexByName = findPropsToEffect(state, stateChanges, filter(valueProps, (prop, name) => !changedPropNames.has(name)))

        // 3. 找到外部变化引起了 state 变化的。找到 stateChange 中残留的。这就是要应用的 state 变化。
        const stateChangesToApply = stateChanges.filter(({ path }) => {
          return !(path[0] in changedState)
        })

        unsafeComputeScope(cnode.scopeId, () => {
          Object.entries(propsToEffectIndexByName).forEach(([propName, prop]) => {
            const nextProp = cacheContainer.get(propName) || getComputedProp(cnode, propName, nextState)
            replace(prop, isRef(prop) ? nextProp.value : nextProp)
          })
          },() => {
          applyPatch(state, stateChangesToApply)
        })
      }
    })
  }
}

/*
 * 需求场景：
 * 1. state 变化 => props 变化。当前的 props 变化和 state 是一致的，可以跳过计算步骤。
 */

