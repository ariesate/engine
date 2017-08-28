/**
 * applyStateTreeSubscriber 提供 pub 和 sub 功能。对组件的精确更新主要就是依靠这里的机制。
 * 它做了一件事：
 * 1. 劫持 stateTree 的 register 函数，精确地将组件的 subscriber 和相应的 stateId，也就是
 * 相应的数据关联起来。
 *
 * 阅读完 applyStateTreeSubscriber 之后建议阅读 createBackground 或者 convertFragment 。
 */
import { each } from './util'
import createSubscribers from './createSubscribers'

export default function applyStateTreeSubscriber(createStateTree) {
  return function createStateTreeWithSubscriber(...arg) {
    const subscribers = {}
    const globalSubscriber = createSubscribers()
    const forceGlobalSubscriber = createSubscribers()
    const stateTree = createStateTree(...arg)
    // 类似锁的机制，保证修改 state 的时候，没有冲突
    let inSession = false
    let changesGroupById = {}


    // changesGroupById 的结构是 { stateId: [{statePath, valuePath}], stateId2: [{statePath, valuePath}]}
    // 发生任意 set 操作就会 notify
    function notify(toNotify = changesGroupById) {
      // CAUTION state change records 可能有重复的，所以这里记录一下
      changesGroupById = {}

      // 这里的精确通知是服务于 connect 的
      each(toNotify, (changes, id) => {
        if (subscribers[id] !== undefined) {
          subscribers[id].notify(changes)
        }
      })

      // 这里的全局通知服务于 mapBackgroundToState 和 visible 的依赖计算
      globalSubscriber.notify(toNotify)
    }

    function notifyForce(changesToReturnGroupById) {
      forceGlobalSubscriber.notify(changesToReturnGroupById)
    }

    // 全局依赖
    function subscribe(fn) {
      return globalSubscriber.insert(fn)
    }

    function forceSubscribe(fn) {
      return forceGlobalSubscriber.insert(fn)
    }

    // 两个 subscribe 分开语意更明确, subscribeByStateId 用来订阅一般事件（用户自定义事件）
    function subscribeByStateId(stateId, fn) {
      if (subscribers[stateId] === undefined) { subscribers[stateId] = createSubscribers() }
      return subscribers[stateId].insert(fn)
    }

    function cache() {
      inSession = true
    }

    function flush() {
      inSession = false
      notify()
    }

    function saveChangesGroupById(fn, argLength) {
    // 如果 stateTree 的改变是涉及到多个变动，就整理成 changesGroupById
      return (...args) => {
        const fnArgs = args.slice(0, argLength)
        const changes = fn(...fnArgs)
        const reason = args[argLength]
        const changesToReturnGroupById = {}
        changes.forEach((change) => {
          const { stateId } = change
          if (changesGroupById[stateId] === undefined) {
            changesGroupById[stateId] = []
          }
          changesGroupById[stateId].push({ ...change, reason })

          if (changesToReturnGroupById[stateId] === undefined) {
            changesToReturnGroupById[stateId] = []
          }
          changesToReturnGroupById[stateId].push({ ...change, reason })
        })
        return changesToReturnGroupById
      }
    }

    function cacheInSession(fn) {
      return (...args) => {
        const changes = fn(...args)
        if (!inSession) {
          notify()
        }
        notifyForce(changes)
      }
    }

    return {
      origin: stateTree,
      ...stateTree,
      set: cacheInSession(saveChangesGroupById(stateTree.set, 2)),
      merge: cacheInSession(saveChangesGroupById(stateTree.merge, 2)),
      reset: cacheInSession(saveChangesGroupById(stateTree.reset, 1)),
      resetHard: cacheInSession(saveChangesGroupById(stateTree.resetHard, 1)),
      setById: cacheInSession(saveChangesGroupById(stateTree.setById, 2)),
      mergeById: cacheInSession(saveChangesGroupById(stateTree.mergeById, 2)),
      resetById: cacheInSession(saveChangesGroupById(stateTree.resetById, 1)),
      resetHardById: cacheInSession(saveChangesGroupById(stateTree.resetHardById, 1)),
      subscribe,
      forceSubscribe,
      subscribeByStateId,
      cache,
      flush,
    }
  }
}
