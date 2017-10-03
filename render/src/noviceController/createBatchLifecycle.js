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

import { mapValues } from '../util'

const HOOK_CNODE_MAP = {
  [HOOK_BEFORE_PAINT]: ['currentInitialCnodes'],
  [HOOK_AFTER_PAINT]: ['currentInitialCnodes'],
  [HOOK_BEFORE_INITIAL_DIGEST]: ['currentInitialDigestedCnodes'],
  [HOOK_AFTER_INITIAL_DIGEST]: ['currentInitialDigestedCnodes'],
  [HOOK_BEFORE_REPAINT]: ['currentInitialCnodes', 'currentUpdateCnodes'],
  [HOOK_AFTER_REPAINT]: ['currentInitialCnodes', 'currentUpdateCnodes'],
  [HOOK_BEFORE_UPDATE_DIGEST]: ['currentInitialDigestedCnodes', 'currentUpdateDigestedCnodes'],
  [HOOK_AFTER_UPDATE_DIGEST]: ['currentInitialDigestedCnodes', 'currentUpdateDigestedCnodes'],
}

function toMethodName(constant) {
  return constant.replace(/(\.\w)/g, s => s[1].toUpperCase())
}

// 这里的 hooks 只是简单的分发，没有对任何一个 hook 做特殊处理
const HOOKS = mapValues(HOOK_CNODE_MAP, (cnodeNamesToInvoke, HOOK_NAME) => {
  return (collection, moduleSystem) => {
    return () => {
      cnodeNamesToInvoke.forEach((cnodeName) => {
        const cnodes = collection[cnodeName]
        cnodes.forEach((cnode) => {
          const methodName = toMethodName(HOOK_NAME)
          if (cnode.type[methodName] !== undefined) {
            cnode.type[methodName](moduleSystem.inject(cnode))
          }
        })
      })
    }
  }
})

function dispatch(hooksToMatch, hookName, ...argv) {
  if (hooksToMatch[hookName] !== undefined) {
    return hooksToMatch[hookName](...argv)
  }
}

export default function createLifecycle(moduleSystem) {
  const hookArgv = {
    currentInitialCnodes: null,
    currentUpdateCnodes: null,
    currentInitialDigestedCnodes: null,
    currentUpdateDigestedCnodes: null,
  }

  let toFlush = []

  return {
    invoke(name) {
      toFlush.push(dispatch(HOOKS, name, hookArgv, moduleSystem))
    },
    startSession() {
      // TODO 检测是否全部消费干净
      hookArgv.currentInitialCnodes = []
      hookArgv.currentUpdateCnodes = []
      hookArgv.currentInitialDigestedCnodes = []
      hookArgv.currentUpdateDigestedCnodes = []
    },
    endSession() {
      toFlush.forEach(fn => fn())
      hookArgv.currentInitialCnodes = []
      hookArgv.currentUpdateCnodes = []
      hookArgv.currentInitialDigestedCnodes = []
      hookArgv.currentUpdateDigestedCnodes = []
      toFlush = []
    },
    collectInitialCnode(cnode) {
      hookArgv.currentInitialCnodes.push(cnode)
    },
    collectUpdateCnode(cnode) {
      hookArgv.currentUpdateCnodes.push(cnode)
    },
    collectInitialDigestedCnode(cnode) {
      hookArgv.currentInitialDigestedCnodes.push(cnode)
    },
    collectUpdateDigestedCnodes(cnode) {
      hookArgv.currentUpdateDigestedCnodes.push(cnode)
    },
  }
}
