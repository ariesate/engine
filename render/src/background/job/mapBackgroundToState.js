import { StatePath } from '../../common'
import { compose } from '../../util'
import { REASON_JOB_MAP_BACK_GROUND_TO_STATE } from '../../constant'

export function initialize(utilInstances, stateTree) {
  const stateIdToMapFns = {}

  function register(stateId, { mapBackgroundToState = [] }) {
    stateIdToMapFns[stateId] = mapBackgroundToState
  }

  // 跑一遍得到结果
  function run(stateId) {
    const state = stateTree.getById(stateId)
    const statePath = state._getStatePath()
    const injectedFns = stateIdToMapFns[stateId].map(
      mapFn => arg => ({
        ...arg,
        nextState: { ...arg.nextState, ...mapFn(arg) },
      }),
    )
    return compose(injectedFns)({ ...utilInstances, state, statePath: new StatePath(statePath), nextState: {} }).nextState
  }

// 处理结果
  function handle(stateId, result) {
    stateTree.mergeById(stateId, result, {
      type: REASON_JOB_MAP_BACK_GROUND_TO_STATE,
    })
  }

  return {
    register,
    run,
    handle,
  }
}

export function check({ mapBackgroundToState }) {
  return mapBackgroundToState !== undefined && mapBackgroundToState.length !== 0
}
