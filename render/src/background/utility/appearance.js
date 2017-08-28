import createStatePathCollector from '../createStatePathCollector'

export function initialize(stateTree, appearance) {
  const collector = createStatePathCollector()

  function isVisibleById(id) {
    collector.insert(id)
    return appearance.isVisibleById(id)
  }

  return {
    isVisibleById,
    collect: collector.collect,
    extract: collector.extract,
    subscribe: (...arg) => appearance.subscribe(...arg),
  }
}

export function test(dep, { change }) {
  return change.some(id => dep[id] !== undefined)
}

export function check() {
  // 不需要参与到组件中
  return false
}
