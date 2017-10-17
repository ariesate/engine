import { Reaction } from 'mobx'
import exist from '../../exist'

function createCache(getObservable, observing) {
  const keysToRead = observing.map(o => o.name.replace(/^[A-Za-z0-9@_]+\./, ''))
  return function cache() {
    keysToRead.forEach((key) => {
      exist.get(getObservable(), key)
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
  reaction.getDisposer()()
  return [result, cacheFn]
}

export function once(fn, listener) {
  let tracked = false
  const reaction = new Reaction(undefined, function () {
    if (!tracked) {
      this.track(fn)
      tracked = true
    } else {
      listener()
      reaction.getDisposer()()
    }
  })

  reaction.getDisposer().onError((err) => {
    /* eslint-disable no-console */
    console.err(err)
    /* eslint-enable no-console */
  })

  reaction.schedule()
}
