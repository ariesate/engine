import { StatePath } from '../../common'


export function initialize(utilInstances, stateTree, appearance) {
  const stateIdToVisibleFns = {}

  function register(stateId, { visible = [] }) {
    stateIdToVisibleFns[stateId] = visible
  }

  // 跑一遍得到结果
  function run(stateId) {
    const state = stateTree.getById(stateId)
    const statePath = state._getStatePath()
    return stateIdToVisibleFns[stateId].every(v => v({ ...utilInstances, state, statePath: new StatePath(statePath) }))
  }

// 处理结果
  function handle(stateId, result) {
    appearance.setVisibleById(stateId, result)
  }

  return {
    register,
    run,
    handle,
  }
}

export function check({ visible }) {
  return visible !== undefined && visible.length !== 0
}
