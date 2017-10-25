import { mapValues, noop, map, filter, compose } from '../util'
// import * as baseAppearanceMod from './modules/appearance'
import * as stateTreeMod from './modules/stateTree/index'
import * as refMod from './modules/ref'
import * as listenerMod from './modules/listener'
import * as lifecycleMod from './modules/lifecycle'

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
  session: (sessionName, fn) => fn(),
  unit: (unitName, cnode, fn) => fn(),
}

export default function createNoviceModuleSystem(inputMods, collectChangedCnodes, apply) {
  const baseMods = {
    stateTree: { ...stateTreeMod, argv: [collectChangedCnodes] },
    // appearance: { ...baseAppearanceMod, argv: [initialAppearance, onChange] },
  }

  const system = {}
  const mods = mapValues({
    ref: refMod,
    listener: listenerMod,
    lifecycle: lifecycleMod,
    ...inputMods,
  }, mod => ({ ...mod, argv: (mod.argv || []).concat(apply, collectChangedCnodes, system) }))

  const baseInstances = mapValues(baseMods, baseMod => baseMod.initialize(...(baseMod.argv || [])))
  const instances = mapValues(mods, mod => mod.initialize(...mod.argv))

  Object.assign(system, mapValues(defaultFns, (defaultFn, name) => combineInstancesMethod(baseInstances, instances, baseMods, mods, name, defaultFn)))

  system.instances = { ...baseInstances, ...instances }
  return system
}
