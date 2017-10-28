import { walkCnodes } from './common'
import { values } from './util'
import createNoviceModuleSystem from './moduleSystem/createModuleSystem'

/**
 * Controller is the backbone to assemble scheduler, painter and view.
 * The module system and lifecycle is provided by Novice controller, not the engine.
 */
export default function createNoviceController(mods = {}) {
  let scheduler = null
  let ctree = null

  // TODO use a tree to store
  function collectChangedCnodes(cnodes) {
    scheduler.collectChangedCnodes(cnodes)
  }

  function startUpdateSession(fn) {
    scheduler.startUpdateSession(fn)
  }

  /* eslint-disable no-use-before-define */
  const moduleSystem = createNoviceModuleSystem(mods, startUpdateSession, collectChangedCnodes)
  /* eslint-enable no-use-before-define */

  return {
    renderer: {
      rootRender(cnode) {
        return cnode.type.render({ children: cnode.children })
      },
      initialRender(cnodeToInitialize, parent) {
        return moduleSystem.initialRender(cnodeToInitialize, (cnode) => {
          const { render } = cnode.type
          moduleSystem.initialize(cnode, parent)
          const injectArgv = moduleSystem.inject(cnode)
          injectArgv.children = cnode.children

          return moduleSystem.hijack(cnode, render, injectArgv)
        })
      },
      updateRender(cnodeToUpdate) {
        return moduleSystem.updateRender(cnodeToUpdate, (cnode) => {
          const { render } = cnode.type
          moduleSystem.update(cnode)
          const injectArgv = moduleSystem.inject(cnode)
          injectArgv.children = cnode.children

          return moduleSystem.hijack(cnode, render, injectArgv)
        })
      },
    },
    supervisor: {
      filterNext(result) {
        const { toInitialize, toDestroy = {} } = result
        // TODO remove toDestroy in cnodesToRepaint
        walkCnodes(values(toDestroy), moduleSystem.destroy)
        // CAUTION Unlike React, Novice only render new cnode during repaint,
        // while React recursively re-render child components.
        return { toPaint: toInitialize, toDispose: toDestroy }
      },
      session: moduleSystem.session,
      unit: moduleSystem.unit,
    },

    observer: {
      invoke: (fn, ...argv) => {
        fn(...argv)
      },
    },

    paint: vnode => ctree = scheduler.startInitialSession(vnode),
    receiveScheduler: s => scheduler = s,
    apply: fn => scheduler.startUpdateSession(fn),
    dump() {},
    // for debug
    instances: moduleSystem.instances,
    getCtree: () => ctree,
    getStateTree: () => moduleSystem.instances.stateTree,
  }
}
