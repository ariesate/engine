import { mapValues } from '../util'

export function initialize(apply, _, system) {
  return {
    initialize: next => (cnode, ...argv) => {
      next(cnode, ...argv)
      if (cnode.type.actions !== undefined) {
        cnode.actions = mapValues(cnode.type.actions, (action) => {
          return (...actionArgv) => {
            apply(() => action(system.inject(cnode), ...actionArgv))
          }
        })
      }
    },
    api: {
      get(statePath) {
        return system.instances.stateTree.api.getCnode(statePath).actions
      },
    },
  }
}
