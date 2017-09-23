/* eslint-disable no-underscore-dangle */
import { each } from './util'
import exist from './exist'
import createStateNode from './createStateNode'
import createSubscribers from './createSubscribers'
import { EVENT_DROP } from './constant'

export default function createStateTree() {
  const stateNodes = {}
  const stateTree = {}
  let shouldCache = false
  let cachedChanges = []

  const subscribers = {}
  const globalSubscriber = createSubscribers()

  function subscribe(id, fn) {
    if (id === undefined) return globalSubscriber.insert(fn)

    if (subscribers[id] === undefined) subscribers[id] = createSubscribers()
    return subscribers[id].insert(fn)
  }

  function notify(changes) {
    const changesGroupById = changes.reduce((result, [type, id, path]) => {
      if (type === 'get') return result
      if (result[id] === undefined) result[id] = []

      result[id].push({ type, path })
      return result
    }, {})
    each(changesGroupById, (c, id) => {
      subscribers[id].notify(c)
    })
  }

  function cache() {
    shouldCache = true
  }

  function flush() {
    shouldCache = false
    const toNotify = cachedChanges.slice()
    cachedChanges = []
    notify(toNotify)
  }

  function collect(...change) {
    // 拦截一下 drop
    if (shouldCache) {
      cachedChanges.push(change)
    } else {
      notify([change])
    }
  }

  function drop(id) {
    cachedChanges.push([EVENT_DROP, id])
    delete stateNodes[id]
  }

  const getContext = () => ({
    root: stateTree,
    collect,
    drop,
    assign(stateNode) { return stateNodes[stateNode._getId()] = stateNode },
    getAssigned(id) { return stateNodes[id] },
  })

  function register(statePath, state, type, subscriber) {
    const node = createStateNode(getContext, state)
    exist.set(stateTree, statePath, node)
    subscribe(node._getId(), subscriber)
    return node._getId()
  }

  function get(statePath) {
    return exist.get(stateTree, statePath)
  }

  function getById(id) {
    return stateNodes[id]
  }

  return {
    get,
    getById,
    subscribe,
    cache,
    flush,
    register,
  }
}
