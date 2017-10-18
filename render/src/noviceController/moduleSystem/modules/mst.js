import { types, destroy } from 'mobx-state-tree'
import { autorun, Reaction } from 'mobx'
import { createOnceReactionProxy } from './stateTree/once'
import { each } from '../../../util'

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
  // TODO 处理几层？
  const proxyState = {}
  each(state, (value, key) => {
    defineProxyValue(proxyState, key, mstState, state)
  })

  return proxyState
}

export function initialize({ rootType, modelDefs = {}, initialState = {} }, apply, onChange) {
  // TODO 到底是由我们定义 model 还是外部？
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
      () => onChange([cnode]),
      () => delete cnode.reaction,
    )

    cnode.reaction.onError((err) => {
      // TODO 更具体的错误处理
      /* eslint-disable no-console */
      console.error(err)
      throw err
      /* eslint-enable no-console */
    })
    return cnode.reaction.run()
  }

  function afterSession() {
    // CAUTION 先不管是哪个 session， 只要执行过， initialized 肯定是 true
    // CAUTION 为空判断订不能丢，因为 afterSession 中如果继续 apply 会死循环。
    if (cnodesToStartReaction.size !== 0) {
      apply(() => {
        cnodesToStartReaction.forEach((cnode) => {
          onChange([cnode])
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
      // CAUTION 只有开始执行 update 的才注入
      const mstState = cnode.props.mapMSTToState({ ...originInjectArgv, mst: root })
      const state = createStateProxy(mstState, cnode.state)
      return {
        ...originInjectArgv,
        state,
        mst: root,
      }
    },
    // TODO initialRender 永远不要observe？因为总是等稳定之后重刷一次？
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

// TODO 这里还有问题， startInitialSession 这种第一个参数不是 cnode
export function test(cnode, methodName) {
  if (methodName === 'inject') return true
  return !(typeof cnode === 'object' && cnode.props.mapMSTToState === undefined)
}

export { types, autorun, Reaction, destroy }
