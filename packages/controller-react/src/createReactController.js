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
        return cnode.type.render(cnode.props)
      },
      initialRender(cnodeToInitialize) {

        const ComponentClass = cnodeToInitialize.type
        cnodeToInitialize.instance = new ComponentClass(cnodeToInitialize.props)
        cnodeToInitialize.instance.props = cnodeToInitialize.props
        // 补全无 constructor 的状况
        if (cnodeToInitialize.instance.state === undefined) cnodeToInitialize.instance.state = {}
        // TODO 为了防止出现循环递归的 session，需要改造一下 reportChange
        cnodeToInitialize.instance.$$reportChange$$ = () => scheduler.collectChangedCnodes([cnodeToInitialize])
        return cnodeToInitialize.instance.render()
      },
      updateRender(cnodeToUpdate) {
        const nextState = cnodeToUpdate.instance.nextStateFn !== undefined ?
          {
            ...cnodeToUpdate.instance.state,
            ...cnodeToUpdate.instance.nextStateFn(cnodeToUpdate.instance.state)
          } :  cnodeToUpdate.instance.state


        cnodeToUpdate.instance.props = cnodeToUpdate.props
        cnodeToUpdate.instance.state = nextState
        delete cnodeToUpdate.instance.nextStateFn

        // TODO shouldComponentUpdate 机制有问题，用 return false 已经太晚了
        // return shouldUpdate ? cnodeToUpdate.instance.render() : false
        return cnodeToUpdate.instance.render()
      },
    },
    isComponentVnode(v) {
      return v.type.prototype instanceof Component
    },
    supervisor: {
      // TODO shouldComponentUpdate()
      filterNext(result) {
        const { toInitialize, toRemain, toDestroy = {} } = result
        return { toPaint: toInitialize, toRepaint: toRemain, toDispose: toDestroy }
      },
      // TODO static getDerivedStateFromProps() initial
      // TODO static getDerivedStateFromProps() update
      // TODO getSnapshotBeforeUpdate()
      // TODO componentWillUnmount()
      // TODO componentDidMount()
      // TODO componentDidUpdate() 在 userDidSeeUpdate 中
      // TODO componentDidCatch() 给 instance 每个方法都包装一下
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
