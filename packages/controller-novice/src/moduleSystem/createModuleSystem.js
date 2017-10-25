import { noop } from '../util'
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

export default function createNoviceModuleSystem(inputMods, apply, collectChangedCnodes) {
  const mods = [
    { stateTree: { ...stateTreeMod, argv: [apply, collectChangedCnodes] } },
    {
      ref: { ...refMod, argv: [apply, collectChangedCnodes] },
      listener: { ...listenerMod, argv: [apply, collectChangedCnodes] },
      lifecycle: { ...lifecycleMod, argv: [apply, collectChangedCnodes] },
    },
    inputMods,
  ]

  return createMultiLayeredModuleSystem(API, mods)
}
