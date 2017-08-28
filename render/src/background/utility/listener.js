import { mapValues, concat, inject } from '../../util'
import { StatePath } from '../../common'

function sortListeners(listenerDef = {}, defaultListener) {
  const { preventDefault = false, fns: listenerFns = [] } = listenerDef
  const finalListenerList = (preventDefault !== true) ? [defaultListener] : []

  listenerFns.forEach(({ before, fn }) => {
    if (before === true) {
      finalListenerList.unshift(fn)
    } else {
      finalListenerList.push(fn)
    }
  })

  return finalListenerList
}

export function initialize(stateTree, appearance, instances) {
  const stateIdToListeners = {}
  const stateIdToListenerFactory = {}

  function getInjectArg(stateId) {
    const state = stateTree.getById(stateId)
    return {
      state,
      statePath: new StatePath(state._getStatePath()),
      rootStatePath: new StatePath(state._getRootStatePath()),
      ...instances,
    }
  }

  function register(stateId, { listeners }) {
    stateIdToListenerFactory[stateId] = mapValues(listeners, listener =>
      defaultListener => concat(
        sortListeners(
          {
            ...listener,
            fns: listener.fns.map(listenerFnDef => ({ ...listenerFnDef, fn: inject(listenerFnDef.fn, () => getInjectArg(stateId)) })),
          },
          defaultListener),
      ),
    )

    return function cancelListener() {
      delete stateIdToListenerFactory[stateId]
      delete stateIdToListeners[stateId]
    }
  }

  function injectListeners(stateId, config, componentArg) {
    stateIdToListeners[stateId] = mapValues(
      stateIdToListenerFactory[stateId],
      (listenerFactory, name) => listenerFactory(componentArg.listeners[name]),
    )

    return {
      ...componentArg,
      listeners: {
        ...componentArg.listeners,
        ...stateIdToListeners[stateId],
      },
    }
  }

  return {
    register,
    inject: {
      fn: injectListeners,
      first: true,
    },
  }
}

export function check({ listeners }) {
  return listeners !== undefined
}
