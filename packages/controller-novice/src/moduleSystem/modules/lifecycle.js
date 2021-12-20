import { UNIT_INITIAL_DIGEST, UNIT_UPDATE_DIGEST } from '@ariesate/are/constant'

function unitNameToLifecycleName(unitName, before) {
  const prefix = before ? 'before' : 'after'
  return `${prefix}${unitName.replace(/^unit\.(\w)/, (_, l) => l.toUpperCase())}`
}

export function initialize(apply, collect, system) {
  let afterSessionLifecycle = []

  return {
    unit: next => (sessionName, unitName, cnode, fn) => {
      if (cnode.type.lifecycle === undefined)
        return next(unitName, cnode, fn)

      const beforeLifecycleName = unitNameToLifecycleName(unitName, true)
      const afterLifecycleName = unitNameToLifecycleName(unitName)
      if (cnode.type.lifecycle[beforeLifecycleName]) {
        cnode.type.lifecycle[beforeLifecycleName](system.inject(cnode))
      }
      next(unitName, cnode, fn)
      if (cnode.type.lifecycle[afterLifecycleName]) {
        if (unitName === UNIT_UPDATE_DIGEST || unitName === UNIT_INITIAL_DIGEST) {
          afterSessionLifecycle.push(() => cnode.type.lifecycle[afterLifecycleName](system.inject(cnode)))
        } else {
          cnode.type.lifecycle[afterLifecycleName](system.inject(cnode))
        }
      }
    },
    session: next => (sessionName, fn) => {
      next(sessionName, fn)
      if (afterSessionLifecycle.length !== 0) {
        apply(() => {
          afterSessionLifecycle.forEach(lifecycleFn => lifecycleFn())
        })
        afterSessionLifecycle = []
      }
    },
  }
}

