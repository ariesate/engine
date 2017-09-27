import createTwoLayerModuleSystem from './createTwoLayerModuleSystem'
import * as baseStateTreeMod from './base/stateTree'
import * as baseAppearanceMod from './base/appearance'
import * as stateTreeMod from './modules/stateTree'
import * as refMod from './modules/ref'
import * as listenerMod from './modules/listener'

export default function createNoviceModuleSystem(inputMods, onChange, initialState = {}, initialAppearance = {}) {
  const baseMods = {
    stateTree: { ...baseStateTreeMod, argv: [initialState, onChange] },
    appearance: { ...baseAppearanceMod, argv: [initialAppearance, onChange] },
  }

  const mods = {
    stateTree: stateTreeMod,
    ref: refMod,
    listener: listenerMod,
  }

  return createTwoLayerModuleSystem(baseMods, mods)
}
