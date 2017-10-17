import { mapValues } from '../../../util'

export function initialize(_, apply) {
  // 默认 mod 都没有更新能力，一定要通过操作 stateTree 和 appearance 来更新
  return {
    initialize(next) {
      return (cnode, ...argv) => {
        next(cnode, ...argv)
        cnode.listeners = mapValues(cnode.type.listeners, (listener) => {
          return (...runtimeArgv) => apply(() => listener({ state: cnode.state }, ...runtimeArgv))
        })
      }
    },
    inject(next) {
      return (cnode) => {
        return {
          ...next(cnode),
          listeners: cnode.listeners,
        }
      }
    },
  }
}

export function test(cnode) {
  return cnode.type.listeners !== undefined
}

