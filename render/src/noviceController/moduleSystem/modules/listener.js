import { mapValues } from '../../../util'

export function initialize(_, apply) {
  // 默认 mod 都没有更新能力，一定要通过操作 stateTree 和 appearance 来更新
  return {
    initialize(__, cnode) {
      cnode.listeners = mapValues(cnode.type.listeners, (listener) => {
        return (...argv) => apply(() => listener({ state: cnode.stateNode }, ...argv))
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

