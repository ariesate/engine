import { types } from 'mobx-state-tree'
import { autorun, Reaction } from 'mobx'
import { createOnceReactionProxy } from './stateTree/once'
import { mapValues, each } from '../../../util'

function defineProxyValue(obj, key, mstState, state) {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: false,
    get() {
      /* eslint-disable no-prototype-builtins */
      return mstState.hasOwnProperty(key) ? mstState[key] : state[key]
      /* eslint-enable no-prototype-builtins */
    },
  })
}

function createStateProxy(mstState, state) {
  // TODO 处理几层？
  const proxyState = {}
  each(state, (value, key) => {
    defineProxyValue(proxyState, key, mstState, state)
  })

  return proxyState
}

export function initialize({ rootType, modelDefs = {}, initialState = {} }, apply, onChange) {
  // 默认 mod 都没有更新能力，一定要通过操作 stateTree 和 appearance 来更新
  const models = mapValues(
    modelDefs,
    (modelDef, name) =>
      types
        .model(name, modelDef)
        .actions(self => ({
          set: (key, value) => self[key] = value,
        })),
  )
  const root = models[rootType].create(initialState)

  function observeRender(render, cnode, ...argv) {
    cnode.reaction = createOnceReactionProxy(
      () => render(cnode, ...argv),
      () => onChange([cnode]),
      () => delete cnode.reaction,
    )

    cnode.reaction.onError((err) => {
      // TODO 更具体的错误处理
      /* eslint-disable no-console */
      console.lerr(err)
      /* eslint-enable no-console */
    })
    return cnode.reaction.run()
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
      const mstState = cnode.props.mapMSTToState(root)
      const state = createStateProxy(mstState, cnode.state)
      return {
        ...next(cnode),
        state,
        mst: root,
      }
    },
    initialRender: next => (cnode, ...argv) => {
      return observeRender(next, cnode, ...argv)
    },
    updateRender: next => (cnode, ...argv) => {
      return observeRender(next, cnode, ...argv)
    },
    api: {
      root,
    },
  }
}

// TODO 这里还有问题， startInitialSession 这种第一个参数不是 cnode
export function test(cnode) {
  return !(typeof cnode === 'object' && cnode.props.mapMSTToState === undefined)
}

export { types, autorun, Reaction }
