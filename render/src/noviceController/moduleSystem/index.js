import { mapValues, noop } from '../../util'
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
  })
}
