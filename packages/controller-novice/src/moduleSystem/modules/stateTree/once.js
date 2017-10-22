import { Reaction } from 'mobx'
import exist from '../../exist'

function createCache(getObservable, observing) {
  const keys = observing.map(o => o.name)
  return function cache() {
    const observable = getObservable()
    const name = observable.$mobx.name
    const keysToRead = keys.filter(key => key.slice(0, name.length) === name).map(key => key.replace(/^[A-Za-z0-9@_]+\./, ''))
    keysToRead.forEach((key) => {
      exist.get(observable, key)
    })
  }
}

export function getReactionCacheFn(getObservable, fn) {
  const reaction = new Reaction('sss')
  let result = null
  reaction.track(() => {
    result = fn()
  })
  const cacheFn = createCache(getObservable, reaction.observing)
  reaction.dispose()
  return [result, cacheFn]
}


export function getCacheFnFromReactionProxy(reactionProxy, getObservable, fn) {
  const result = fn()
  const cacheFn = createCache(getObservable, reactionProxy.getObserving())
  return [result, cacheFn]
}

export function once(fn, listener, afterFire = () => {}) {
  let tracked = false
  let result
  const reaction = new Reaction(undefined, function () {
    if (!tracked) {
      this.track(() => {
        result = fn()
      })
      tracked = true
    } else {
      listener()
      reaction.dispose()
      afterFire()
    }
  })

  reaction.schedule()

  return [result, reaction]
}

export function createOnceReactionProxy(fn, listener, afterFire = () => {}) {
  let tracked = false
  let result

  const reaction = new Reaction(undefined, function () {
    if (!tracked) {
      this.track(() => {
        result = fn()
      })
      tracked = true
    } else {
      listener()
      reaction.dispose()
      afterFire()
    }
  })

  return {
    run() {
      reaction.schedule()
      return result
    },
    getObserving() {
      return reaction.observing
    },
    onError(errorFn) {
      reaction.getDisposer().onError(errorFn)
    },
    dispose() {
      reaction.dispose()
    },
  }
}
