import { mapValues, noop, map, filter, compose } from '../util'
// import * as baseAppearanceMod from './modules/appearance'
import * as stateTreeMod from './modules/stateTree/index'
import * as refMod from './modules/ref'
import * as listenerMod from './modules/listener'

function combineInstancesMethod(baseInstances, instances, baseMods, mods, method, defaultFn) {
  const involvedBaseIns = filter(baseInstances, i => i[method] !== undefined)
  const involvedIns = filter(instances, i => i[method] !== undefined)

  function getRuntimeFns(currentIns, currentMods, cnode) {
    return map(
      filter(
        currentIns,
        (_, name) => (currentMods[name].test === undefined || currentMods[name].test(cnode, method)),
      ),
      ins => ins[method],
    )
  }

  return (cnode, ...runtimeArgv) => {
    // TODO May stored the functions in cnode as a cache
    // CAUTION compose if LIFO, so we need to put base functions at the end.
    const runtimeFns = getRuntimeFns(involvedIns, mods, cnode).concat(getRuntimeFns(involvedBaseIns, baseMods, cnode))
    return compose(runtimeFns)(defaultFn)(cnode, ...runtimeArgv)
  }
}


const defaultFns = {
  inject: () => ({}),
  hijack: (cnode, render, ...argv) => render(...argv),
  initialize: noop,
  update: noop,
  destroy: noop,
  afterInitialDigest: noop,
  initialRender: (cnode, initialRender) => initialRender(cnode),
  updateRender: (cnode, updateRender) => updateRender(cnode),
  startInitialSession: start => start(),
  startUpdateSession: start => start(),
  beforeLifecycle: noop,
  afterLifecycle: noop,
}

export default function createNoviceModuleSystem(inputMods, onChange, apply, initialState = {}) {
  const baseMods = {
    stateTree: { ...stateTreeMod, argv: [initialState, onChange] },
    // appearance: { ...baseAppearanceMod, argv: [initialAppearance, onChange] },
  }

  const result = {}
  const mods = mapValues({
    ref: refMod,
    listener: listenerMod,
    ...inputMods,
  }, mod => ({ ...mod, argv: (mod.argv || []).concat(apply, onChange, result) }))

  const baseInstances = mapValues(baseMods, baseMod => baseMod.initialize(...(baseMod.argv || [])))
  const instances = mapValues(mods, mod => mod.initialize(...mod.argv))

  Object.assign(result, mapValues(defaultFns, (defaultFn, name) => combineInstancesMethod(baseInstances, instances, baseMods, mods, name, defaultFn)))

  result.instances = { ...baseInstances, ...instances }
  return result
}
