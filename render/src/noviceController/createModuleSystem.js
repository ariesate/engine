import { mapValues, map, filter, compose } from '../util'

// 这里不需要用 middleware 的模型，因为各个模块应该是相互独立的，不存先后顺序
// TODO validator 和 listener 这种约定怎么算?
function combineInstancesMethod(instances, mods, method, defaultFn) {
  const involvedIns = filter(instances, i => i[method] !== undefined)

  return (cnode, ...runtimeArgv) => {
    const runtimeFns = map(
      filter(
        involvedIns,
        (_, name) => (mods[name].test === undefined || mods[name].test(cnode)),
      ),
      i => lastResult => i[method](lastResult, cnode, ...runtimeArgv),
    )
    return compose(runtimeFns)(defaultFn(cnode, ...runtimeArgv))
  }
}

export default function createModuleSystem(mods, stateTree, appearance) {
  const instances = mapValues(mods, mod => mod.initialize(stateTree, appearance))

  return mapValues({
    inject: () => ({}),
    hijack: (cnode, fn, ...argv) => fn(...argv),
    initialize: () => {},
    update: () => {},
    destroy: () => {},
  }, (defaultFn, name) => combineInstancesMethod(instances, mods, name, defaultFn))
}
