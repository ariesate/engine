import { mapValues } from '../../util'

export function initialize(apply) {
  return {
    initialize(next) {
      return (cnode, ...argv) => {
        next(cnode, ...argv)
        if (cnode.type.listeners === undefined) return

        cnode.listeners = mapValues(cnode.type.listeners, (listener, name) => {
          const combinedListener = (...runtimeArgv) => apply(() => {
            // trick here, we attach arguments of listener to function ref
            const injectedArgv = combinedListener.argv
            listener(injectedArgv, ...runtimeArgv)
            if (cnode.props.listeners && cnode.props.listeners[name]) {
              cnode.props.listeners[name](injectedArgv, ...runtimeArgv)
            }
          })
          combinedListener.argv = {}
          return combinedListener
        })
      }
    },
    // inject to render.
    inject(next) {
      return (cnode) => {
        const injectedArgv = next(cnode)
        return cnode.type.listeners === undefined ?
          injectedArgv :
          { ...injectedArgv,
            listeners: cnode.listeners,
          }
      }
    },
  }
}
