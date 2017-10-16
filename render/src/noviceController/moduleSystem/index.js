import { mapValues } from '../../util'
import createTwoLayerModuleSystem from './createTwoLayerModuleSystem'
import * as baseStateTreeMod from './base/stateTree'
import * as baseAppearanceMod from './base/appearance'
import * as stateTreeMod from './modules/stateTree'
import * as refMod from './modules/ref'
import * as listenerMod from './modules/listener'

export default function createNoviceModuleSystem(inputMods, onChange, apply, initialState = {}, initialAppearance = {}) {
  const baseMods = {
    stateTree: { ...baseStateTreeMod, argv: [initialState, onChange] },
    appearance: { ...baseAppearanceMod, argv: [initialAppearance, onChange] },
  }

  const mods = mapValues({
    stateTree: stateTreeMod,
    ref: refMod,
    listener: listenerMod,
    ...inputMods,
  }, mod => ({ ...mod, argv: (mod.argv || []).concat(apply) }))

  return createTwoLayerModuleSystem(baseMods, mods, {
    inject: () => ({}),
    hijack: (cnode, fn, ...argv) => fn(...argv),
    initialize: () => {},
    update: () => {},
    destroy: () => {},
    afterInitialDigest: () => {},
  })
}
