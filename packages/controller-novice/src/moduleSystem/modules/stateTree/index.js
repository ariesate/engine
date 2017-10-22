import { extendObservable } from 'mobx'
import { dump, restore } from './dump'
import { once, getReactionCacheFn, getCacheFnFromReactionProxy } from './once'
import { createUniqueIdGenerator, ensureArray } from '../../../util'
import exist from '../../exist'

function createStateClass(type, getInitialState) {
  const StateNodeClass = function (currentState) {
    // TODO add reset function?
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
    // TODO use outer reaction because mobx reaction can not be nested.
    const [result, cacheFn] = cnode.reaction ?
      getCacheFnFromReactionProxy(cnode.reaction, () => cnode.state, () => render(cnode, ...argv)) :
      getReactionCacheFn(() => cnode.state, () => render(cnode, ...argv))
    cnode.reactionCacheFn = cacheFn
    cnodesToStartReaction.add(cnode)
    return result
  }

  function afterSession() {
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

      // TODO need to support scope lift up.
      // Layout component may not want to attach child component state in its own state.
      const { bind = generateBind() } = cnode.props
      if (cnode.type.getDefaultState === undefined) cnode.type.getDefaultState = () => ({})

      // CAUTION cnode may not have parent.
      const parentGetDefaultState = (cnode.parent && cnode.parent.type.getDefaultState) ? cnode.parent.type.getDefaultState : () => ({})
      const initialStateInTree = exist.get(initialStateTree, resolveBind(cnode), {})
      // TODO need deepMerge
      const mergedInitialState = dump({
        ...cnode.type.getDefaultState(),
        ...exist.get(parentGetDefaultState(), bind, {}),
        ...initialStateInTree,
      })
      const getInitialState = () => restore(mergedInitialState)
      const currentState = isInitialized ? exist.get(cnode.parent.state, bind) : initialStateInTree

      cnode.State = createStateClass(cnode.type, getInitialState)

      const state = new cnode.State(currentState)

      // CAUTION Side effects.
      cnode.state = state
      exist.set(cnode.parent.state || root, bind, state)
    },
    // CAUTION User need to handle state right. We do not validate state anymore.
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
