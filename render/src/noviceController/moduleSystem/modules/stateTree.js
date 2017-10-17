import exist from '../exist'

export function initialize({ stateTree }) {
  return {
    initialize: next => (cnode) => {
      next(cnode)
      stateTree.initialize(cnode)
    },
    destroy: next => (cnode) => {
      next(cnode)
      stateTree.destroy(cnode)
    },
    inject: next => (cnode) => {
      // console.log("injecting", cnode.state)
      return {
        ...next(cnode),
        state: cnode.state,
      }
    },
    initialRender: next => (cnode, ...argv) => {
      return stateTree.observeRender(next, cnode, ...argv)
    },
    updateRender: next => (cnode, ...argv) => {
      return stateTree.observeRender(next, cnode, ...argv)
    },
    startInitialSession: next => (fn) => {
      next(fn)
      stateTree.afterSession()
    },
    startUpdateSession: next => (fn) => {
      // transaction(() => next(fn))
      next(fn)
      stateTree.afterSession()
    },
    api: {
      get(statePath) {
        return exist.get(stateTree.getState(), statePath)
      },
    },
    dump() {
      // TODO 还要保存 ordered Map 等数据结构信息
      // return root.toJS()
    },
    load() {
      // TODO 还要load ordered Map 等数据结构信息
      // TODO 如果回滚到上一次使用完全重新 render 的方式，那么就不用！
    },
  }
}
