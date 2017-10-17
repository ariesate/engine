import { extendObservable, Reaction } from 'mobx'
import { dump, restore } from './dump'
// import { dump, restore } from 'dumpjs'
import { createUniqueIdGenerator, ensureArray } from '../../../../util'
import exist from '../../exist'

// const dump = {dump() {},restore() {}}

function createCache(getObservable, observing) {
  const keysToRead = observing.map(o => o.name.replace(/^[A-Za-z0-9@_]+\./, ""))
  return function cache() {
    keysToRead.forEach((key) => {
      exist.get(getObservable(), key)
    })
  }
}

function getReactionCacheFn(getObservable, fn) {
  const reaction = new Reaction('sss')
  let result = null
  reaction.track(() => {
    result = fn()
  })
  const cacheFn = createCache(getObservable, reaction.observing)
  reaction.getDisposer()()
  return [result, cacheFn]
}

function once(fn, listener) {
  let tracked = false
  const reaction = new Reaction(undefined, function () {
    if (!tracked) {
      this.track(fn)
      tracked = true
    } else {
      listener()
      reaction.getDisposer()()
    }
  })

  reaction.getDisposer().onError((err) => {
    console.err(err)
  })

  reaction.schedule()
}

function createStateClass(type, getInitialState) {
  const StateNodeClass = function (currentState) {
    // TODO 可以把 reset 之类的函数增加到这个上面？
    extendObservable(this, { ...getInitialState(), ...currentState })
  }
  StateNodeClass.displayName = type.displayName
  return StateNodeClass
}

function resolveBind(cnode) {
  const result = cnode.props.bind ? ensureArray(cnode.props.bind.slice(0)) : []
  return cnode.parent ? resolveBind(cnode.parent).concat(result) : result
}

export function initialize(initialStateTree={}, onChange) {
  const root = {}
  const generateBind = createUniqueIdGenerator('bind')
  const cnodesToStartReaction = new Set()
  let isInitialized = false

  return {
    initialize(cnode) {
      if (cnode.State !== undefined) {
        throw new Error('cnode has State Class already')
      }
      // TODO scope 要支持指定成上一级，比如有些布局组件，自己也有 state，但并不想把子组件数据也挂在自己下面
      // 约定 scope === 空数组时即为上一层
      const { bind = generateBind() } = cnode.props
      if (cnode.type.getDefaultState === undefined) cnode.type.getDefaultState = () => ({})

      // CAUTION 这里一定要这样判断，因为 parent 可能是 root, 没有经过 initialize，没有 getDefaultState
      // state 的数据需要三个参数:
      // defaultState: 来自于自己的 type
      // initialState: 来自与 父组件 defaultState 中, initialStateTree
      // 当前值: 如果当前 isInitialized 为 true, 那么么当前 tree 上的就是运行时数据，否则用 initialStateTree 上的值做当前值。
      // 现在的问题是，由于运行时的数据也是直接在
      const parentGetDefaultState = (cnode.parent && cnode.parent.type.getDefaultState) ? cnode.parent.type.getDefaultState : () => ({})
      const initialStateInTree = exist.get(initialStateTree, resolveBind(cnode), {})
      // TODO 要 deepMerge
      // CAUTION 无论如何，getInitialState 也要保证数据是完整的，这样运行时的数据才可以不完整，方便用户。
      const mergedInitialState = dump({
        ...cnode.type.getDefaultState(),
        ...exist.get(parentGetDefaultState(), bind, {}),
        ...initialStateInTree,
      })
      const getInitialState = () => restore(mergedInitialState)
      const currentState = isInitialized ? exist.get(cnode.parent.state, bind) : initialStateInTree

      cnode.State = createStateClass(cnode.type, getInitialState)

      const state = new cnode.State(currentState)

      // CAUTION 这里有副作用
      cnode.state = state
      exist.set(cnode.parent.state || root, bind, state)
    },
    destroy(cnode) {
      if (!cnode.parent) {
        delete root[cnode.props.bind]
      }
      cnode.cancelReaction()
    },
    observeRender(render, cnode, ...argv) {
      const [result, cacheFn] = getReactionCacheFn(() => cnode.state, () => render(cnode, ...argv))
      cnode.reactionCacheFn = cacheFn
      cnodesToStartReaction.add(cnode)
      return result
    },
    // 等稳定了之后，对 cnode 的 state 所有一级字段读一遍就好了
    afterSession() {
      // TODO 先不管是哪个 session， 只要执行过， initialized 肯定是 true
      isInitialized = true
      cnodesToStartReaction.forEach((cnode) => {
        once(cnode.reactionCacheFn, () => onChange([cnode]))
        cnodesToStartReaction.delete(cnode)
      })
    },
    getState() {
      return root
    },
  }
}
