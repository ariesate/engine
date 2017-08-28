import { partialRight, some } from '../../util'
import exist from '../../exist'
import createStatePathCollector from '../createStatePathCollector'
import { escapeDot } from '../common'
import createSubscribers from '../../createSubscribers'

export function initialize() {
  const store = {}
  const listeners = createSubscribers()
  const collector = createStatePathCollector()

  function set(inputStatePath, inputValue, createMissing, merge) {
    const nextValue = merge ? { ...exist.set(store, inputStatePath), ...inputValue } : inputValue
    const result = exist.set(store, inputStatePath, nextValue, createMissing)
    if (result) {
      listeners.notify(inputStatePath)
    }
    return result
  }

  function get(inputStatePath, defaultValue) {
    collector.insert(inputStatePath)
    return exist.get(store, inputStatePath, defaultValue)
  }

  return {
    set,
    get,
    merge: partialRight(set, true),
    collect: collector.collect,
    extract: collector.extract,
    subscribe: (...arg) => listeners.insert(...arg),
  }
}

export function test(depStatePaths, inputStatePath) {
  return some(depStatePaths, (_, path) => {
    const exp = new RegExp(`^${escapeDot(path)}${path === '' ? '' : '\\.'}`)
    return (inputStatePath === path || exp.test(inputStatePath))
  })
}

export function check() {
  // 不需要参与到组件中
  return false
}
