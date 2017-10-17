import { mapValues, noop, map, filter, compose } from '../../util'
// import * as baseAppearanceMod from './modules/appearance'
import * as stateTreeMod from './modules/stateTree'
import * as refMod from './modules/ref'
import * as listenerMod from './modules/listener'


function combineInstancesMethod(baseInstances, instances, baseMods, mods, method, defaultFn) {
  const involvedBaseIns = filter(baseInstances, i => i[method] !== undefined)
  const involvedIns = filter(instances, i => i[method] !== undefined)

  function getRuntimeFns(currentIns, currentMods, cnode) {
    return map(
      filter(
        currentIns,
        (_, name) => (currentMods[name].test === undefined || currentMods[name].test(cnode)),
      ),
      ins => ins[method],
    )
  }

  return (cnode, ...runtimeArgv) => {
    // TODO 可以作为缓存存在 cnode 上
    // CAUTION 这里一定要把 base 的函数放在前面，这样就能保障后面的可以完全控制前面的
    const runtimeFns = getRuntimeFns(involvedBaseIns, baseMods, cnode).concat(getRuntimeFns(involvedIns, mods, cnode))
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
  beforeLifeCycle: noop,
  afterLifeCycle: noop,
}

export default function createNoviceModuleSystem(inputMods, onChange, apply, initialState = {}) {
  const baseMods = {
    stateTree: { ...stateTreeMod, argv: [initialState, onChange] },
    // appearance: { ...baseAppearanceMod, argv: [initialAppearance, onChange] },
  }

  const mods = mapValues({
    ref: refMod,
    listener: listenerMod,
    ...inputMods,
  }, mod => ({ ...mod, argv: (mod.argv || []).concat(apply) }))


  const baseInstances = mapValues(baseMods, baseMod => baseMod.initialize(...(baseMod.argv || [])))
  const instances = mapValues(mods, mod => mod.initialize(baseInstances, ...(mod.argv || [])))

  const result = mapValues(defaultFns, (defaultFn, name) => combineInstancesMethod(baseInstances, instances, baseMods, mods, name, defaultFn))

  result.instances = { ...baseInstances, ...instances }
  return result
}
