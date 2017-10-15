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
  [HOOK_BEFORE_PAINT]: ['initialCnodes'],
  [HOOK_AFTER_PAINT]: ['initialCnodes'],
  [HOOK_BEFORE_INITIAL_DIGEST]: ['initialDigestedCnodes'],
  [HOOK_AFTER_INITIAL_DIGEST]: ['initialDigestedCnodes'],
  [HOOK_BEFORE_REPAINT]: ['initialCnodes', 'updateCnodes'],
  [HOOK_AFTER_REPAINT]: ['initialCnodes', 'updateCnodes'],
  [HOOK_BEFORE_UPDATE_DIGEST]: ['initialDigestedCnodes', 'updateDigestedCnodes'],
  [HOOK_AFTER_UPDATE_DIGEST]: ['initialDigestedCnodes', 'updateDigestedCnodes'],
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
    initialCnodes: null,
    updateCnodes: null,
    initialDigestedCnodes: null,
    updateDigestedCnodes: null,
  }

  let toFlush = []

  return {
    invoke(name) {
      toFlush.push(dispatch(HOOKS, name, hookArgv, moduleSystem))
    },
    startSession() {
      // TODO 检测是否全部消费干净
      hookArgv.initialCnodes = []
      hookArgv.updateCnodes = []
      hookArgv.initialDigestedCnodes = []
      hookArgv.updateDigestedCnodes = []
    },
    endSession() {
      // TODO 加上 try catch 防止某个组件 hook 破坏循环
      toFlush.forEach(fn => fn())
      hookArgv.initialCnodes = []
      hookArgv.updateCnodes = []
      hookArgv.initialDigestedCnodes = []
      hookArgv.updateDigestedCnodes = []
      toFlush = []
    },
    collectInitialCnode(cnode) {
      hookArgv.initialCnodes.push(cnode)
    },
    collectUpdateCnode(cnode) {
      hookArgv.updateCnodes.push(cnode)
    },
    collectInitialDigestedCnode(cnode) {
      hookArgv.initialDigestedCnodes.push(cnode)
    },
    collectUpdateDigestedCnodes(cnode) {
      hookArgv.updateDigestedCnodes.push(cnode)
    },
    // TODO 为 debug 导出工具函数
  }
}
