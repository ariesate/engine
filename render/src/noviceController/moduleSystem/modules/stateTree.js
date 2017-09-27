import exist from '../exist'

export function initialize({ stateTree }) {
  return {
    initialize: (_, cnode) => stateTree.initialize(cnode),
    destroy: (_, cnode) => stateTree.initialize(cnode),
    api: {
      get(statePath) {
        return exist.get(stateTree.getState(), statePath)
      },
    },
    inject(lastInject, cnode) {
      return {
        ...lastInject,
        state: cnode.stateNode,
      }
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
