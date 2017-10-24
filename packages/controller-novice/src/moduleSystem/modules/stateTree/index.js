import { extendObservable } from 'mobx'
import { dump, restore } from './dump'
import { once, getReactionCacheFn, getCacheFnFromReactionProxy } from './once'
import { createUniqueIdGenerator, ensureArray } from '../../../util'
import exist from '../../exist'

function createStateClass(type, getInitialState) {
  const StateNodeClass = function (currentState) {
    // TODO add reset function?
    extendObservable(this, { ...getInitialState(), ...currentState })
  }
  StateNodeClass.displayName = type.displayName
  return StateNodeClass
}

function resolveBind(cnode) {
  const result = cnode.props.bind ? ensureArray(cnode.props.bind.slice(0)) : []
  return cnode.parent ? resolveBind(cnode.parent).concat(result) : result
}

export function initialize(initialStateTree = {}, collect) {
  const root = {}
  const generateBind = createUniqueIdGenerator('bind')
  let cnodesToStartReaction = new Set()
  let isInitialized = false

  function observeRender(render, cnode, ...argv) {
    // TODO before real render, should fix all missing child state!!!!!!
    // TODO if child state if changed, it will auto collect child cnode
    // render is always in a repaint session, so just collect it

    // TODO use outer reaction because mobx reaction can not be nested.
    const [result, cacheFn] = cnode.reaction ?
      getCacheFnFromReactionProxy(cnode.reaction, () => cnode.state, () => render(cnode, ...argv)) :
      getReactionCacheFn(() => cnode.state, () => render(cnode, ...argv))
    cnode.reactionCacheFn = cacheFn
    cnodesToStartReaction.add(cnode)
    return result
  }

  function afterSession() {
    isInitialized = true
    cnodesToStartReaction.forEach((cnode) => {
      cnode.cancelReaction = once(cnode.reactionCacheFn, () => collect([cnode]))
    })
    cnodesToStartReaction = new Set()
  }

  return {
    initialRender: next => (cnode, ...argv) => {
      return observeRender(next, cnode, ...argv)
    },
    updateRender: next => (cnode, ...argv) => {
      return observeRender(next, cnode, ...argv)
    },
    initialize: next => (cnode) => {
      next(cnode)
      if (cnode.State !== undefined) {
        throw new Error('cnode has State Class already')
      }

      // TODO need to support scope lift up.
      // Layout component may not want to attach child component state in its own state.
      // Maybe use scopeIndex = cnode.props.scopeIndex - 1?
      const { bind = generateBind() } = cnode.props
      if (cnode.type.getDefaultState === undefined) cnode.type.getDefaultState = () => ({})

      // CAUTION cnode may not have parent.
      const parentGetDefaultState = (cnode.parent && cnode.parent.type.getDefaultState) ? cnode.parent.type.getDefaultState : () => ({})
      const initialStateInTree = exist.get(initialStateTree, resolveBind(cnode), {})
      // TODO need deepMerge
      const mergedInitialState = dump({
        ...cnode.type.getDefaultState(),
        ...exist.get(parentGetDefaultState(), bind, {}),
        ...initialStateInTree,
      })
      const getInitialState = () => restore(mergedInitialState)
      cnode.State = createStateClass(cnode.type, getInitialState)

      const currentState = isInitialized ? exist.get(cnode.parent.state, bind) : initialStateInTree
      // CAUTION Side effects.
      cnode.state = new cnode.State(currentState)

      exist.set(cnode.parent.state || root, bind, cnode.state)
      if (cnode.parent && cnode.parent.parent) {
        cnode.parent.reportAttachPoint(bind)
      }
      cnode.attachPoint = new Set()
      cnode.reportAttachPoint = (childBind) => {
        cnode.attachPoint.add(childBind)
        // TODO add observer to detect attachPoint change
        // TODO 会不会出现，一个数据被另一个组件用了的情况？ 如果会，岂不是要每次 render 的时候再 attach。
        // A: 应该全部放到 observeRender 里面去。 其实在 render 之后就已经可以知道所有 attach point 了，分析 next 即可
        // initialRender 负责向上补全数据，  updateRender 负责修补子 child state。只不过在修补的过程中，会发现子 child
        // 也可能有变化，有的话就要 collect。这里的相当于补充了本来应该有用户进行的改动。
        // 应该没有问题。反正每次都是通过 render 进行一次性的 observe。只不过有可能一个数据被两个组件用。那也只要组件在
        // destroy 的时候记得断开 reaction 就行了。
        // TODO 分析一下，要不改成 attachPoint 变了的都重新渲染？这样效率高还是重重监控效率高？主要问题是要修补！merge!
        // 而不只是检测哪个变化了，merge 会不会有性能问题？比如说大表格？vue 在处理大表格时是不是也有性能问题？不用担心，未来再优化。
      }
    },
    startInitialSession: next => (fn) => {
      next(fn)
      afterSession()
    },
    startUpdateSession: next => (fn) => {
      next(fn)
      afterSession()
    },
    // CAUTION User need to handle state right. We do not validate state anymore.
    // update() {
    //
    // }
    destroy: next => (cnode) => {
      next(cnode)
      cnode.cancelReaction()
    },
    inject: next => (cnode) => {
      return {
        ...next(cnode),
        state: cnode.state,
        stateTree: root,
      }
    },
    api: {
      get(statePath) {
        return exist.get(root, statePath)
      },
    },
  }
}
