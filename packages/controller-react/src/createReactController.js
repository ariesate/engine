import Component from './Component'
/**
 * lifecycles:
 *
 * mounting:
 * static getDerivedStateFromProps()
 * componentDidMount()
 *
 * updating
 * static getDerivedStateFromProps()
 * shouldComponentUpdate()
 * getSnapshotBeforeUpdate()
 * componentDidUpdate()
 *
 * Unmounting
 * componentWillUnmount()
 *
 * Error handling
 * componentDidCatch()
 *
 */

/**
 * Controller is the backbone to assemble scheduler, painter and view.
 * The module system and lifecycle is provided by Novice controller, not the engine.
 */
export default function createReactController() {
  let scheduler = null
  let ctree = null

  return {
    renderer: {
      rootRender(cnode) {
        // 根节点 cnode 是由 scheduler 创建的，type 上 只有一个 render 和 displayName
        return cnode.type.render({ children: cnode.children })
      },
      initialRender(cnodeToInitialize) {

        const ComponentClass = cnodeToInitialize.type
        cnodeToInitialize.instance = new ComponentClass(cnodeToInitialize.props)
        cnodeToInitialize.instance.props = cnodeToInitialize.props
        // TODO 为了防止出现循环递归的 session，需要改造一下 reportChange
        cnodeToInitialize.instance.$$reportChange$$ = () => scheduler.collectChangedCnodes([cnodeToInitialize])
        return cnodeToInitialize.instance.render()
      },
      updateRender(cnodeToUpdate) {

        cnodeToUpdate.instance.props = cnodeToUpdate.props
        const result = cnodeToUpdate.instance.render()
        return result
      },
    },
    isComponentVnode(v) {
      return v.type.prototype instanceof Component
    },
    supervisor: {
      // TODO shouldComponentUpdate()
      filterNext(result) {
        const { toInitialize, toRemain, toDestroy = {} } = result
        // CAUTION Unlike React, Novice only render new cnode during repaint,
        // while React recursively re-render child components.
        return { toPaint: toInitialize, toRepaint: toRemain, toDispose: toDestroy }
      },
      // TODO static getDerivedStateFromProps() initial
      // TODO static getDerivedStateFromProps() update
      // TODO componentWillUnmount()
      // TODO getSnapshotBeforeUpdate()
      // TODO componentDidMount()
      // TODO componentDidUpdate()
      // TODO componentDidCatch()
      session: (sessionName, startSession) => startSession(),
      unit: (sessionName, unitName, cnode, startUnit) => startUnit(),
    },
    observer: {
      invoke: (fn, ...argv) => {
        scheduler.startUpdateSession(() => fn(...argv))
      },
    },

    paint: vnode => ctree = scheduler.startInitialSession(vnode),
    receiveScheduler: s => scheduler = s,
    apply: fn => scheduler.startUpdateSession(fn),
    dump() {},
    // for debug
    getCtree: () => ctree,
  }
}
