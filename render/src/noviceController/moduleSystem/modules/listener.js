import { mapValues } from '../../../util'

export function initialize(apply) {
  // 默认 mod 都没有更新能力，一定要通过操作 stateTree 和 appearance 来更新
  return {
    initialize(next) {
      return (cnode, ...argv) => {
        next(cnode, ...argv)
        cnode.generateListeners = (injectedArgv) => {
          return mapValues(cnode.type.listeners, (listener, name) => {
            return (...runtimeArgv) => apply(() => {
              listener(injectedArgv, ...runtimeArgv)
              if (cnode.props.listeners && cnode.props.listeners[name]) {
                cnode.props.listeners[name](injectedArgv, ...runtimeArgv)
              }
            })
          })
        }
      }
    },
    // 这是注入到 render.
    inject(next) {
      return (cnode) => {
        const injectedArgv = next(cnode)
        return {
          ...injectedArgv,
          listeners: cnode.generateListeners(injectedArgv),
        }
      }
    },
  }
}

export function test(cnode) {
  return cnode.type.listeners !== undefined
}

