import { ensureArray } from '../util'
import { TRANSACTION_REPAINT, TRANSACTION_FIRST_PAINT } from './constant'
import { walkCnodes, makeVnodeKey } from '../common'
import createStateTree from './createStateTree'
import createAppearance from './createAppearance'

function ensureKeyedArray(ret) {
  return ensureArray(ret).map((v, index) => Object.assign(v, { key: makeVnodeKey(v, index) }))
}


function createModuleSystem() {
  return {
    inject: () => ({}),
    hijack: (fn, ...argv) => fn(...argv),
    initialize: () => {},
    update: () => {},
    destroy: () => {},
  }
}

/**
 * controller 是把 renderer/view 统一在一起的抽象层。
 * 注意，对整个引擎架构的约定到这里为止。至于 noviceController 中的 background 抽象
 * 纯属 noviceController 内部架构约定。
 *
 * @param plugins
 * @returns {*}
 */
export default function createNoviceController(initialState, initialAppearance, mods = {}) {
  let scheduler = null
  let view = null
  let ctree = null
  let cnodeToRepaint = []
  let cnodeToDigest = []
  let openCollect = false

  // let currentTransaction = null
  // const transactionCallback = []
  let onChange = () => {}

  // TODO transaction 现在好像没什么用
  function transaction(name, fn) {
    // currentTransaction = name
    const result = fn()
    // currentTransaction = null
    // TODO call transaction callback
    return result
  }

  // 对外提供的接口
  function paint(vnode) {
    transaction(TRANSACTION_FIRST_PAINT, () => {
      ctree = scheduler.paint(vnode)
    })

    // CAUTION traversor 会在 build 读取的过程中动态往 ctree 上添加 ref/viewRefs 引用
    view.initialDigest(ctree)
  }

  // TODO 用户处理紧急需求
  function repaintImmediately(cnode) {
    scheduler.repaint([cnode])
    view.updateDigest(cnode)
  }

  function repaint() {
    transaction(TRANSACTION_REPAINT, () => {
      // TODO 这里要将 cnodeToDigest 从数组改成 orderedSet。来去掉重复的。
      scheduler.repaint(cnodeToRepaint)
      cnodeToRepaint = []

      // CAUTION 在重绘时可以优化的是：隔一段时间再真实操作 dom。
      // cnodeToDigest 是 updateRender 时塞进去的
      cnodeToDigest.forEach((currentCnode) => {
        // 后面参数中的 cnode.viewRefs 是在 generateInitialTraversor 中生成的
        // CAUTION traversor 会在 build 读取的过程中动态往 ctree 上添加 ref/viewRefs 引用
        view.updateDigest(currentCnode)
      })

      cnodeToDigest = []
      onChange(ctree)
    })
  }

  // 基础设施
  // CAUTION 由于我们调和的过程也会改变数据，但是调和时时不需要 repaint 的
  const onBaseChange = (cnodes) => {
    if (openCollect) {
      cnodeToRepaint = cnodeToRepaint.concat(cnodes)
    }
  }
  const stateTree = createStateTree(initialState, onBaseChange)
  const appearance = createAppearance(initialAppearance, onBaseChange)
  // 上层模块系统
  // TODO controller 要把 view batch 传给 moduleSystem,
  // 但是对 module 来说，仍然只是和 controller 的约定, controller 应该对 module 屏蔽 view 概念
  const moduleSystem = createModuleSystem(mods, stateTree, appearance, view)

  return {
    // 创建 background 只是为了把一部分 controller 的功能抽出去，得到一个更平整的抽象，用于构建更上层的系统
    renderer: {
      rootRender(cnode) {
        // root 没有注入任何东西
        return ensureArray(cnode.type.render())
      },
      // TODO appearance 也要 hijack 怎么办？拆成两部分，一部分是基础设施，一部分是 module？
      initialRender(cnode, parent) {
        const { render } = cnode.type
        stateTree.initialize(cnode)
        appearance.initialize(cnode)
        // view ref 在 cnode 上，要注入给 moduleSystem
        moduleSystem.initialize(cnode, parent)

        const injectArgv = {
          ...stateTree.inject(cnode, parent),
          ...moduleSystem.inject(cnode, parent),
        }

        // CAUTION 注意这里我们注意的参数是一个，不是数组
        // CAUTION 由于第一层返回值没有 key，我们手动加上
        return ensureKeyedArray(moduleSystem.hijack(render, injectArgv))
      },
      // TODO appearance 也要 hijack 怎么办？拆成两部分，一部分是基础设施，一部分是 module？
      updateRender(cnode) {
        const { render } = cnode.type
        // view ref 在 cnode 上，要注入给 moduleSystem
        moduleSystem.update(cnode)
        const injectArgv = {
          ...stateTree.inject(cnode),
          ...moduleSystem.inject(cnode),
          refs: cnode.view.getRefs(),
          viewRefs: cnode.view.getViewRefs(),
        }


        cnodeToDigest.push(cnode)
        // CAUTION 由于第一层返回值没有 key，我们手动加上
        return ensureKeyedArray(moduleSystem.hijack(render, injectArgv))
      },
    },
    // controller 的 intercepter 接口
    intercepter: {
      intercept(result) {
        const { toInitialize, toDestroy } = result
        walkCnodes(toDestroy, (current) => {
          stateTree.destroy(current.statePath)
          appearance.destroy(current.statePath)
          moduleSystem.destroy(current)
        })

        // CAUTION 这里决定了我们的更新模式是精确更新，始终只渲染要新增的，remain 的不管。
        // TODO 这里对 toRemain 的没有进行判断 children 是否发生了变化！！！！！
        return toInitialize
      },
    },

    observer: {
      invoke: () => {
        // 先执行用户的所有函数

        // repaint
      },
      // TODO 在这里要实现 didMount
    },

    paint,
    repaint,
    repaintImmediately,
    // 存储外部传入的 scheduler
    receiveScheduler: s => scheduler = s,
    receiveView: v => view = v,
    // for debug
    onChange: o => onChange = o,
    getCtree: () => ctree,
    getStateTree: () => stateTree,

    dump() {

    },
    collect(fn) {
      openCollect = true
      fn()
      openCollect = false
    },
  }
}
