import { mapValues } from '../../util'

export function initialize(apply) {
  return {
    initialize(next) {
      return (cnode, ...argv) => {
        next(cnode, ...argv)
        cnode.generateListeners = (injectedArgv) => {
          const listeners = mapValues(cnode.type.listeners, (listener, name) => {
            return (...runtimeArgv) => apply(() => {
              // listener can call another listener
              listener({ ...injectedArgv, listeners }, ...runtimeArgv)
              if (cnode.props.listeners && cnode.props.listeners[name]) {
                cnode.props.listeners[name](injectedArgv, ...runtimeArgv)
              }
            })
          })

          return listeners
        }
      }
    },
    // inject to render.
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
