import Component from './Component'
import { invariant, isSubClassOf, isCustomRawFunction } from './util'

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

// hooks support
let currentWorkingCnode = null
let currentWorkingCnodeData = undefined
function withCurrentWorkingCnode(cnode, fn) {
  invariant(currentWorkingCnode === null, 'last working unit is not done')
  currentWorkingCnode = cnode
  const result = fn()
  currentWorkingCnode = null
  currentWorkingCnodeData = undefined
  return result
}

export function getCurrentWorkingCnode(initialData) {
  const data = currentWorkingCnodeData === undefined ? initialData : currentWorkingCnodeData
  return [currentWorkingCnode, data, (nextData) => currentWorkingCnodeData = nextData]
}

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
        invariant(typeof ComponentClass === 'function', `unknown component type ${typeof ComponentClass}`)
        if (isSubClassOf(ComponentClass, Component)) {
          cnodeToInitialize.instance = new ComponentClass(cnodeToInitialize.props)
        } else {
          cnodeToInitialize.instance = {
            render() {
              return ComponentClass(cnodeToInitialize.instance.props)
            }
          }
        }


        cnodeToInitialize.instance.props = cnodeToInitialize.props
        // 补全无 constructor 的状况
        if (cnodeToInitialize.instance.state === undefined) cnodeToInitialize.instance.state = {}
        // TODO 为了防止出现循环递归的 session，需要改造一下 reportChange
        cnodeToInitialize.instance.$$reportChange$$ = () => scheduler.collectChangedCnodes([cnodeToInitialize])
        cnodeToInitialize.instance.$$nextStateFns = []
        return cnodeToInitialize.instance.render()
      },
      updateRender(cnodeToUpdate) {
        const nextState = cnodeToUpdate.instance.$$nextStateFns.reduce((lastState, nextFn) => {
          const computeResult = (typeof nextFn === 'function') ? nextFn(lastState) : nextFn
          return {...lastState, ...computeResult }
        }, cnodeToUpdate.instance.state)

        cnodeToUpdate.instance.$$nextStateFns = []
        cnodeToUpdate.instance.props = cnodeToUpdate.props
        cnodeToUpdate.instance.state = nextState

        // TODO shouldComponentUpdate 机制有问题，用 return false 已经太晚了
        return cnodeToUpdate.instance.render()
      },
    },
    isComponentVnode(v) {
      return isSubClassOf(v.type, Component) || isCustomRawFunction(v.type)
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
      // componentDidMount()
      // TODO componentDidUpdate() 在 userDidSeeUpdate 中
      // TODO componentDidCatch() 给 instance 每个方法都包装一下
      unit: (sessionName, unitName, cnode, startUnit) => {
        return withCurrentWorkingCnode(cnode, startUnit)
      },

      session: (sessionName, startSession) => {
        startSession()
      },

    },
    observer: {
      invoke: (fn, ...argv) => {
        scheduler.startUpdateSession(() => fn(...argv))
      },
    },

    paint: vnode => ctree = scheduler.startInitialSession(vnode),
    receiveScheduler: s => {
      scheduler = s
    },
    apply: fn => scheduler.startUpdateSession(fn),
    dump() {},
    // for debug
    getCtree: () => ctree,
  }
}
