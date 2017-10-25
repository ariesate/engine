import { noop } from './util'
import { walkCnodes } from './common'
import createNoviceModuleSystem from './moduleSystem/index'
import createBatchLifecycle from './createBatchLifecycle'
import {
  HOOK_BEFORE_REPAINT,
  HOOK_AFTER_REPAINT,
  HOOK_BEFORE_UPDATE_DIGEST,
  HOOK_AFTER_UPDATE_DIGEST,
  HOOK_BEFORE_PAINT,
  HOOK_AFTER_PAINT,
  HOOK_BEFORE_INITIAL_DIGEST,
  HOOK_AFTER_INITIAL_DIGEST,
} from './constant'

/**
 * Controller is the backbone to assemble scheduler, painter and view.
 * The module system and lifecycle is provided by Novice controller, not the engine.
 */
export default function createNoviceController(mods = {}, initialState, initialAppearance) {
  let scheduler = null
  let view = null
  let ctree = null
  let openCollect = false
  let inSession = false
  const sessions = []

  // TODO use a tree to store
  const cnodesToRepaint = new Set()
  const cnodesToDigest = new Set()

  /* eslint-disable no-use-before-define */
  const moduleSystem = createNoviceModuleSystem(mods, collectCnodesToRepaint, applyChange, initialState, initialAppearance)
  /* eslint-enable no-use-before-define */
  const lifecycle = createBatchLifecycle(moduleSystem)

  function collect(fn) {
    openCollect = true
    fn()
    openCollect = false
  }

  function collectCnodesToRepaint(cnodes) {
    if (openCollect) {
      cnodes.forEach(cnode => cnodesToRepaint.add(cnode))
    }
  }

  function repaint() {
    scheduler.repaint(cnodesToRepaint)
    cnodesToRepaint.clear()
  }

  function updateDigest() {
    // CAUTION View digest can be debounced with DOM view digest algorithm support.
    cnodesToDigest.forEach((currentCnode) => {
      view.updateDigest(currentCnode)
    })
    cnodesToDigest.clear()
  }

  function applyChange(fn) {
    sessions.push(fn)
    /* eslint-disable no-use-before-define */
    startUpdateSession()
    /* eslint-enable no-use-before-define */
  }

  function startInitialSession(vnode) {
    moduleSystem.startInitialSession(() => {
      inSession = true
      lifecycle.startSession()
      ctree = scheduler.paint(vnode)
      view.initialDigest(ctree)
      // CAUTION in digest lifecycle, there may be cnodes changed.
      if (cnodesToRepaint.size !== 0) {
        // If any cnode changed during last lifecycle, start a new session.
        applyChange(noop)
      }
      lifecycle.endSession()
      inSession = false
    })
  }

  function startUpdateSession() {
    if (!inSession) {
      moduleSystem.startUpdateSession(() => {
        inSession = true
        let currentSession
        /* eslint-disable no-cond-assign */
        while (currentSession = sessions.shift()) {
          lifecycle.startSession()
          /* eslint-disable no-loop-func */
          collect(() => {
            currentSession()
          })
          repaint()
          updateDigest()
          /* eslint-enable no-loop-func */
          // CAUTION in digest lifecycle, there may be cnodes changed.
          if (cnodesToRepaint.size !== 0) {
            // If any cnode changed during last lifecycle, start a new session.
            applyChange(noop)
          }
          lifecycle.endSession()
        }
        inSession = false
      })
    }
  }

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

          lifecycle.invoke(HOOK_BEFORE_PAINT, cnode, true)
          const result = moduleSystem.hijack(cnode, render, injectArgv)
          lifecycle.invoke(HOOK_AFTER_PAINT, cnode, false, true)
          return result
        })
      },
      updateRender(cnodeToUpdate) {
        return moduleSystem.updateRender(cnodeToUpdate, (cnode) => {
          const { render } = cnode.type
          moduleSystem.update(cnode)
          const injectArgv = moduleSystem.inject(cnode)
          injectArgv.children = cnode.children

          lifecycle.invoke(HOOK_BEFORE_REPAINT, cnode, true)
          const result = moduleSystem.hijack(cnode, render, injectArgv)
          cnodesToDigest.add(cnode)
          lifecycle.invoke(HOOK_AFTER_REPAINT, cnode, false, true)
          return result
        })
      },
    },
    intercepter: {
      intercept(result) {
        const { toInitialize, toDestroy = {} } = result
        // TODO remove toDestroy in cnodesToRepaint
        walkCnodes(Object.values(toDestroy), moduleSystem.destroy)
        // CAUTION Unlike React, Novice only render new cnode during repaint,
        // while React recursively re-render child components.
        return toInitialize
      },
    },

    observer: {
      invoke: (fn, ...argv) => {
        fn(...argv)
      },
      initialDigest(cnode, digestFn) {
        lifecycle.invoke(HOOK_BEFORE_INITIAL_DIGEST, cnode, true)
        const result = digestFn()
        collect(() => {
          lifecycle.invoke(HOOK_AFTER_INITIAL_DIGEST, cnode, false, true)
        })
        return result
      },
      updateDigest(cnode, digestFn) {
        lifecycle.invoke(HOOK_BEFORE_UPDATE_DIGEST, cnode, true)
        const result = digestFn()
        collect(() => {
          lifecycle.invoke(HOOK_AFTER_UPDATE_DIGEST, cnode, false, true)
        })
        return result
      },
    },

    paint: startInitialSession,
    receiveScheduler: s => scheduler = s,
    receiveView: v => view = v,
    apply: applyChange,
    // for debug
    getCtree: () => ctree,
    getStateTree: () => moduleSystem.instances.stateTree,
    dump() {},
    instances: moduleSystem.instances,
    getLifecycle: () => lifecycle,
  }
}
