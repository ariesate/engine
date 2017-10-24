
export function initialize(apply, _, system) {
  return {
    afterLifecycle: next => (cnode, hookName, ...argv) => {
      next(cnode, hookName, ...argv)
      if (cnode.type.onGlobalKeyboard && hookName === 'hookAfterInitialDigest') {
        const listener = (e) => {
          apply(() => {
            cnode.type.onGlobalKeyboard(system.inject(cnode), e.type, e)
          })
        }

        document.body.addEventListener('keyup', listener)
        document.body.addEventListener('keydown', listener)

        cnode.cancelKeyboardListener = () => {
          document.body.removeEventListener('keyup', listener)
          document.body.removeEventListener('keydown', listener)
        }
      }
    },
    destroy(cnode) {
      if (cnode.cancelKeyboardListener) {
        cnode.cancelKeyboardListener()
      }
    },
  }
}
