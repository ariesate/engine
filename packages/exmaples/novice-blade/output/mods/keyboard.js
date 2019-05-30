import { CONSTANT } from 'novice'

export function initialize(apply, _, system) {
  return {
    unit: next => (unitName, cnode, ...argv) => {
      next(unitName, cnode, ...argv)
      // console.log(unitName, CONSTANT)
      if (cnode.type.onGlobalKeyboard && unitName === CONSTANT.UNIT_INITIAL_DIGEST) {
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
    destroy: next => (cnode) => {
      next(cnode)
      if (cnode.cancelKeyboardListener) {
        cnode.cancelKeyboardListener()
      }
    },
  }
}
