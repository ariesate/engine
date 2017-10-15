import { ensureArray, noop } from '../util'
import { walkCnodes } from '../common'
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
 * TODO
 * 1. 如果只有 lifecycle，并且 lifecycle 不能控制组件的渲染，那么将来实现 shouldComponentUpdate 时，
 * 应该怎么算？算成是 controller 和组件的约定？
 *
 * 2. shouldComponentUpdate 中收到的 change 由谁注入？
 *
 * 3. lifecycle session 的问题，现在拆分了 render/re-render 和 digest。但实际上用的时候，一直是一起用的。
 * 所以 session 在中间拆开好像也没有意义。
 *
 * 4. lifecycle 在某些 hook 中可能要重新 repaint/digest 。应该提供一个怎样的接口来实现？或者说应该提供一个怎样的
 * 约定或者限制来保障渲染的过程不出现循环，不让人困惑？
 * 可能出现需要重新渲染的hook有：
 * 1. componentWillReceiveState: 在 repaint 前。在此 hook 中只要正常 collect 就好，不需要改动原来的流程。
 * 2. componentDidPaint: 在 paint/repaint 之后，没 Digest, 应该不允许再触发变化。
 * 3. componentDidDigest: 在digest 之后，可能会改动数据，需要完整的重新渲染。
 *
 * 5. 在 hook 中触发的 ajax 等异步 frame 中对数据的改变应该怎么算？应该不用处理，直接用 apply 包装即可。
 */

/**
 * controller 是把 renderer/view 统一在一起的抽象层。
 * 注意，对整个引擎架构的约定到这里为止。至于 noviceController 中的 module & lifecycle 抽象
 * 纯属 noviceController 内部架构约定。
 *
 * lifecycle 并不能重用，它只是 controller 中的一部分。拆分出来只是为了将代码拆分得更清楚而已。
 *
 * @param plugins
 * @returns {*}
 */
export default function createNoviceController(initialState, initialAppearance, mods = {}) {
  let scheduler = null
  let view = null
  let ctree = null
  let openCollect = false
  let inSession = false
  const sessions = []

  // 以下的所有 Set 都是谁消费，谁清空
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
    // CAUTION 在重绘时可以优化的是：隔一段时间再真实操作 dom。
    // renderedUpdateCnodes 是 updateRender 时塞进去的
    cnodesToDigest.forEach((currentCnode) => {
      // 后面参数中的 cnode.viewRefs 是在 generateInitialTraversor 中生成的
      // CAUTION traversor 会在 build 读取的过程中动态往 ctree 上添加 ref/viewRefs 引用
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
    inSession = true
    lifecycle.startSession()
    lifecycle.invoke(HOOK_BEFORE_PAINT)
    ctree = scheduler.paint(vnode)
    lifecycle.invoke(HOOK_AFTER_PAINT)
    lifecycle.invoke(HOOK_BEFORE_INITIAL_DIGEST)
    view.initialDigest(ctree)
    collect(() => {
      lifecycle.invoke(HOOK_AFTER_INITIAL_DIGEST)
    })
    if (cnodesToRepaint.size !== 0) {
      // 如果在最后阶段又产生了新的变化，那么重新来一个 session
      applyChange(noop)
    }
    lifecycle.endSession()
    inSession = false
  }

  function startUpdateSession() {
    if (!inSession) {
      inSession = true
      let currentSession
      /* eslint-disable no-cond-assign */
      while (currentSession = sessions.shift()) {
        lifecycle.startSession()
        /* eslint-enable no-cond-assign */
        /* eslint-disable no-loop-func */
        collect(() => {
          currentSession()
          lifecycle.invoke(HOOK_BEFORE_REPAINT)
        })
        repaint()
        lifecycle.invoke(HOOK_AFTER_REPAINT)
        lifecycle.invoke(HOOK_BEFORE_UPDATE_DIGEST)
        updateDigest()
        collect(() => {
          lifecycle.invoke(HOOK_AFTER_UPDATE_DIGEST)
        })
        /* eslint-enable no-loop-func */
        if (cnodesToRepaint.size !== 0) {
          // 如果在最后阶段又产生了新的变化，那么重新来一个 session
          // TODO 这里为什么不直接往 session 里面 push noop?
          applyChange(noop)
        }
        lifecycle.endSession()
      }
      inSession = false
    }
  }

  return {
    // 创建 background 只是为了把一部分 controller 的功能抽出去，得到一个更平整的抽象，用于构建更上层的系统
    renderer: {
      rootRender(cnode) {
        // root 没有注入任何东西
        return ensureArray(cnode.type.render())
      },
      initialRender(cnode, parent) {
        const { render } = cnode.type
        // view ref 在 cnode 上，要注入给 moduleSystem
        moduleSystem.initialize(cnode, parent)

        const injectArgv = moduleSystem.inject(cnode)
        lifecycle.collectInitialCnode(cnode)
        // CAUTION 注意这里我们注意的参数是一个，不是数组
        return ensureArray(moduleSystem.hijack(cnode, render, injectArgv))
      },
      updateRender(cnode) {
        const { render } = cnode.type
        // view ref 在 cnode 上，要注入给 moduleSystem
        moduleSystem.update(cnode)
        const injectArgv = moduleSystem.inject(cnode)

        lifecycle.collectUpdateCnode(cnode)
        cnodesToDigest.add(cnode)
        return ensureArray(moduleSystem.hijack(cnode, render, injectArgv))
      },
    },
    // controller 的 intercepter 接口
    intercepter: {
      intercept(result) {
        const { toInitialize, toDestroy = {} } = result
        walkCnodes(Object.values(toDestroy), moduleSystem.destroy)
        // CAUTION 这里决定了我们的更新模式是精确更新，始终只渲染新增的，remain 的不管。
        // TODO 这里对 toRemain 的没有进行判断 children 是否发生了变化
        return toInitialize
      },
    },

    observer: {
      invoke: (fn, ...argv) => {
        // 要不要做点什么？
        fn(...argv)
      },
      collectInitialDigestedCnode(cnode) {
        lifecycle.collectInitialDigestedCnode(cnode)
      },
      collectUpdateDigestedCnode(cnode) {
        lifecycle.collectUpdateDigestedCnodes(cnode)
      },
      // TODO 在这里要实现 didMount
    },

    paint: startInitialSession,
    // 存储外部传入的 scheduler
    receiveScheduler: s => scheduler = s,
    receiveView: v => view = v,

    // for debug
    apply: applyChange,
    getCtree: () => ctree,
    getStateTree: () => moduleSystem.instances.stateTree,
    dump() {},
    getLifecycle: () => lifecycle,
  }
}
