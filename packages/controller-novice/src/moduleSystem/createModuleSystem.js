import { noop, mapValues } from '../util'
// import * as baseAppearanceMod from './modules/appearance'
import * as stateTreeMod from './modules/stateTree/index'
import * as refMod from './modules/ref'
import * as listenerMod from './modules/listener'
import * as lifecycleMod from './modules/lifecycle'
import createMultiLayeredModuleSystem from './createMultiLayeredModuleSystem'

const API = {
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

function attachArgv(mods, ...argv) {
  return mapValues(mods, mod => ({
    ...mod,
    argv: (mod.argv || []).concat(argv),
  }))
}

export default function createNoviceModuleSystem(inputMods, apply, collectChangedCnodes) {
  const mods = [
    // basic layer
    { stateTree: { ...stateTreeMod, argv: [apply, collectChangedCnodes] } },
    // novice layer
    attachArgv({
      ref: refMod,
      listener: listenerMod,
      lifecycle: lifecycleMod,
    }, apply, collectChangedCnodes),
    // user layer
    attachArgv(inputMods, apply, collectChangedCnodes),
  ]

  return createMultiLayeredModuleSystem(API, mods)
}
