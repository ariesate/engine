import { types } from 'mobx-state-tree'
import { mapValues } from '../../../util'

export function initialize(_, { rootType, modelDefs, initialState }) {
  // 默认 mod 都没有更新能力，一定要通过操作 stateTree 和 appearance 来更新
  const models = mapValues(modelDefs, (modelDef, name) => types.model(name, modelDef))
  const root = models[rootType].create(initialState)

  return {
    initialize(next) {
      return (cnode, ...argv) => {
        next(cnode, ...argv)
        // TODO 将 galaxy 和 state 绑定
      }
    },
    inject(next) {
      return (cnode) => {
        return {
          ...next(cnode),
          mst: root,
        }
      }
    },
  }
}

export function test(cnode) {
  return cnode.props.mapMSTToState !== undefined
}

