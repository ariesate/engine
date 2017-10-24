import { types, destroy } from 'mobx-state-tree'
import { autorun, Reaction } from 'mobx'
import { createOnceReactionProxy } from './stateTree/once'
import { each } from '../../util'

function defineProxyValue(obj, key, mstState, state) {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: false,
    get() {
      /* eslint-disable no-prototype-builtins */
      return mstState.hasOwnProperty(key) ? mstState[key] : state[key]
      /* eslint-enable no-prototype-builtins */
    },
    set(newValue) {
      state[key] = newValue
    },
  })
}

function createStateProxy(mstState, state) {
  // TODO recursive?
  const proxyState = {}
  each(state, (value, key) => {
    defineProxyValue(proxyState, key, mstState, state)
  })

  return proxyState
}

export function initialize({ rootType, modelDefs = {}, initialState = {} }, apply, collect) {
  // TODO create model here or outside？
  // const models = mapValues(
  //   modelDefs,
  //   (modelDef, name) =>
  //     types
  //       .model(name, modelDef)
  //       .actions(self => ({
  //         set: (key, value) => self[key] = value,
  //       })),
  // )
  const models = modelDefs
  const root = models[rootType].create(initialState)
  const cnodesToStartReaction = new Set()

  function observeRender(render, cnode, ...argv) {
    cnode.reaction = createOnceReactionProxy(
      () => render(cnode, ...argv),
      () => collect([cnode]),
      () => delete cnode.reaction,
    )

    cnode.reaction.onError((err) => {
      /* eslint-disable no-console */
      console.error(err)
      throw err
      /* eslint-enable no-console */
    })
    return cnode.reaction.run()
  }

  function afterSession() {
    // CAUTION Must verifying size or we may get a dead loop.
    if (cnodesToStartReaction.size !== 0) {
      apply(() => {
        cnodesToStartReaction.forEach((cnode) => {
          collect([cnode])
          cnodesToStartReaction.delete(cnode)
        })
      })
    }
  }

  return {
    destroy: next => (cnode) => {
      next()
      if (cnode.reaction !== undefined) {
        cnode.reaction.dispose()
        delete cnode.reaction
      }
    },
    inject: next => (cnode) => {
      const originInjectArgv = next(cnode)
      if (!cnode.reaction) return { ...originInjectArgv, mst: root }
      // CAUTION Only inject in re-render
      const mstState = cnode.props.mapMSTToState({ ...originInjectArgv, mst: root })
      const state = createStateProxy(mstState, cnode.state)
      return {
        ...originInjectArgv,
        state,
        mst: root,
      }
    },
    initialRender: next => (cnode, ...argv) => {
      cnodesToStartReaction.add(cnode)
      return next(cnode, ...argv)
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
      root,
    },
  }
}

export function test(cnode, methodName) {
  if (methodName === 'inject') return true
  return !(typeof cnode === 'object' && cnode.props.mapMSTToState === undefined)
}

export { types, autorun, Reaction, destroy }
