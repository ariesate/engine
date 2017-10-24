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

import { mapValues } from './util'

const HOOK_CNODE_MAP = {
  [HOOK_BEFORE_PAINT]: ['initializedCnodes'],
  [HOOK_AFTER_PAINT]: ['initializedCnodes'],
  [HOOK_BEFORE_INITIAL_DIGEST]: ['initialDigestedCnodes'],
  [HOOK_AFTER_INITIAL_DIGEST]: ['initialDigestedCnodes'],
  [HOOK_BEFORE_REPAINT]: ['initializedCnodes', 'updatedCnodes'],
  [HOOK_AFTER_REPAINT]: ['initializedCnodes', 'updatedCnodes'],
  [HOOK_BEFORE_UPDATE_DIGEST]: ['initialDigestedCnodes', 'updateDigestedCnodes'],
  [HOOK_AFTER_UPDATE_DIGEST]: ['initialDigestedCnodes', 'updateDigestedCnodes'],
}

function toMethodName(constant) {
  return constant.replace(/(\.\w)/g, s => s[1].toUpperCase())
}

// Simple dispatch
const HOOKS = mapValues(HOOK_CNODE_MAP, (cnodeNamesToInvoke, HOOK_NAME) => {
  const methodName = toMethodName(HOOK_NAME)
  return (collection, moduleSystem) => {
    return () => {
      cnodeNamesToInvoke.forEach((cnodeName) => {
        const cnodes = collection[cnodeName]
        cnodes.forEach((cnode) => {
          moduleSystem.beforeLifecycle(cnode, methodName)
          if (cnode.type[methodName] !== undefined) {
            cnode.type[methodName](moduleSystem.inject(cnode))
          }
          moduleSystem.afterLifecycle(cnode, methodName)
        })
      })
    }
  }
})

function dispatch(hooksToMatch, hookName, ...argv) {
  if (hooksToMatch[hookName] === undefined) throw new Error(`invoking unknown hook ${hookName}`)
  return hooksToMatch[hookName](...argv)
}

export default function createLifecycle(moduleSystem) {
  const hookArgv = {
    initializedCnodes: null,
    updatedCnodes: null,
    initialDigestedCnodes: null,
    updateDigestedCnodes: null,
  }

  let toFlush = []

  return {
    invoke(name, immediately) {
      if (immediately) {
        dispatch(HOOKS, name, hookArgv, moduleSystem)()
      } else {
        toFlush.push(dispatch(HOOKS, name, hookArgv, moduleSystem))
      }
    },
    startSession() {
      hookArgv.initializedCnodes = []
      hookArgv.updatedCnodes = []
      hookArgv.initialDigestedCnodes = []
      hookArgv.updateDigestedCnodes = []
    },
    endSession() {
      toFlush.forEach(fn => fn())
      hookArgv.initializedCnodes = []
      hookArgv.updatedCnodes = []
      hookArgv.initialDigestedCnodes = []
      hookArgv.updateDigestedCnodes = []
      toFlush = []
    },
    collectInitialCnode(cnode) {
      hookArgv.initializedCnodes.push(cnode)
    },
    collectUpdateCnode(cnode) {
      hookArgv.updatedCnodes.push(cnode)
    },
    collectInitialDigestedCnode(cnode) {
      hookArgv.initialDigestedCnodes.push(cnode)
    },
    collectUpdateDigestedCnodes(cnode) {
      hookArgv.updateDigestedCnodes.push(cnode)
    },
  }
}
