import { mapValues } from '../../util'

export function initialize() {
  // TODO 怎么就默认 stateNode 一定会产生更新呢？？？
  // 还是说默认说有 mod 都没有更新能力，一定要通过 stateTree 和 appearance?
  return {
    initialize(_, cnode) {
      cnode.listeners = mapValues(cnode.type.listeners, (listener) => {
        return (...argv) => listener({ state: cnode.stateNode }, ...argv)
      })
    },
    inject(lastInject, cnode) {
      return {
        ...lastInject,
        listeners: cnode.listeners,
      }
    },
  }
}

export function test(cnode) {
  return cnode.type.listeners !== undefined
}

