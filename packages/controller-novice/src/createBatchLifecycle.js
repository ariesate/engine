import {
  HOOK_BEFORE_PAINT,
  HOOK_AFTER_PAINT,
  HOOK_BEFORE_INITIAL_DIGEST,
  HOOK_AFTER_INITIAL_DIGEST,
  HOOK_BEFORE_REPAINT,
  HOOK_AFTER_REPAINT,
  HOOK_BEFORE_UPDATE_DIGEST,
  HOOK_AFTER_UPDATE_DIGEST,
} from './constant'

const HOOKS = [
  HOOK_BEFORE_PAINT,
  HOOK_AFTER_PAINT,
  HOOK_BEFORE_INITIAL_DIGEST,
  HOOK_AFTER_INITIAL_DIGEST,
  HOOK_BEFORE_REPAINT,
  HOOK_AFTER_REPAINT,
  HOOK_BEFORE_UPDATE_DIGEST,
  HOOK_AFTER_UPDATE_DIGEST,
]

function toMethodName(constant) {
  return constant.replace(/(\.\w)/g, s => s[1].toUpperCase())
}

function dispatch(hookName, cnode, moduleSystem) {
  if (!HOOKS.includes(hookName)) throw new Error(`invoking unknown hook ${hookName}`)
  const methodName = toMethodName(hookName)
  return () => {
    moduleSystem.beforeLifecycle(cnode, methodName)
    if (cnode.type[methodName] !== undefined) {
      cnode.type[methodName](moduleSystem.inject(cnode))
    }
    moduleSystem.afterLifecycle(cnode, methodName)
  }
}

export default function createLifecycle(moduleSystem) {
  let toFlush = []

  return {
    invoke(name, cnode, immediately = false, reverse = false) {
      const fn = dispatch(name, cnode, moduleSystem)
      if (immediately) {
        fn()
      } else if (reverse) {
        toFlush.unshift(fn)
      } else {
        toFlush.push(fn)
      }
    },
    startSession() {},
    endSession() {
      toFlush.forEach(fn => fn())
      toFlush = []
    },
  }
}
