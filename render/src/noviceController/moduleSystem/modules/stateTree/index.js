import { extendObservable } from 'mobx'
import { dump, restore } from './dump'
import { once, getReactionCacheFn, getCacheFnFromReactionProxy } from './once'
import { createUniqueIdGenerator, ensureArray } from '../../../../util'
import exist from '../../exist'

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

export function initialize(initialStateTree = {}, onChange) {
  const root = {}
  const generateBind = createUniqueIdGenerator('bind')
  const cnodesToStartReaction = new Set()
  let isInitialized = false

  function observeRender(render, cnode, ...argv) {
    // TODO 先通过复用外层 reaction 的形式来解决 reaction 无法嵌套的问题，之后再说
    const [result, cacheFn] = cnode.reaction ?
      getCacheFnFromReactionProxy(cnode.reaction, () => cnode.state, () => render(cnode, ...argv)) :
      getReactionCacheFn(() => cnode.state, () => render(cnode, ...argv))
    cnode.reactionCacheFn = cacheFn
    cnodesToStartReaction.add(cnode)
    return result
  }

  function afterSession() {
    // CAUTION 先不管是哪个 session， 只要执行过， initialized 肯定是 true
    isInitialized = true
    cnodesToStartReaction.forEach((cnode) => {
      once(cnode.reactionCacheFn, () => onChange([cnode]))
      cnodesToStartReaction.delete(cnode)
    })
  }

  return {
    initialize: next => (cnode) => {
      next(cnode)
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
    // CAUTION 由于是主动式的写，因此我们不再对数据进行补全，用户要自己注意。
    // update() {
    //
    // }
    destroy: next => (cnode) => {
      next(cnode)
      if (!cnode.parent) {
        delete root[cnode.props.bind]
      }
      cnode.cancelReaction()
    },
    inject: next => (cnode) => {
      return {
        ...next(cnode),
        state: cnode.state,
        stateTree: root,
      }
    },
    initialRender: next => (cnode, ...argv) => {
      return observeRender(next, cnode, ...argv)
    },
    updateRender: next => (cnode, ...argv) => {
      return observeRender(next, cnode, ...argv)
    },
    startInitialSession: next => (fn) => {
      next(fn)
      afterSession()
    },
    startUpdateSession: next => (fn) => {
      next(fn)
      afterSession()
    },
    api: {
      get(statePath) {
        return exist.get(root, statePath)
      },
    },
  }
}
