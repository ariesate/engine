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
      lifecycle.invoke(HOOK_BEFORE_PAINT, true)
      ctree = scheduler.paint(vnode)
      lifecycle.invoke(HOOK_AFTER_PAINT)
      lifecycle.invoke(HOOK_BEFORE_INITIAL_DIGEST, true)
      view.initialDigest(ctree)
      collect(() => {
        lifecycle.invoke(HOOK_AFTER_INITIAL_DIGEST)
      })
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
          /* eslint-enable no-cond-assign */
          /* eslint-disable no-loop-func */
          collect(() => {
            currentSession()
            lifecycle.invoke(HOOK_BEFORE_REPAINT, true)
          })
          repaint()
          lifecycle.invoke(HOOK_AFTER_REPAINT)
          lifecycle.invoke(HOOK_BEFORE_UPDATE_DIGEST, true)
          updateDigest()
          collect(() => {
            lifecycle.invoke(HOOK_AFTER_UPDATE_DIGEST)
          })
          /* eslint-enable no-loop-func */
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

          lifecycle.collectInitialCnode(cnode)
          return moduleSystem.hijack(cnode, render, injectArgv)
        })
      },
      updateRender(cnodeToUpdate) {
        return moduleSystem.updateRender(cnodeToUpdate, (cnode) => {
          const { render } = cnode.type
          moduleSystem.update(cnode)
          const injectArgv = moduleSystem.inject(cnode)
          injectArgv.children = cnode.children

          lifecycle.collectUpdateCnode(cnode)
          cnodesToDigest.add(cnode)
          return moduleSystem.hijack(cnode, render, injectArgv)
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
      collectInitialDigestedCnode(cnode) {
        lifecycle.collectInitialDigestedCnode(cnode)
      },
      collectUpdateDigestedCnode(cnode) {
        lifecycle.collectUpdateDigestedCnodes(cnode)
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
