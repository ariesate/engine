import createStateClass from './createStateClass'
import createStateIntercepter from './createStateIntercepter'
import { dump, restore } from './dump'
import { once, getReactionCacheFn, getCacheFnFromReactionProxy } from './once'
import { createUniqueIdGenerator, ensureArray } from '../../../util'
import exist from '../../exist'

export function initialize(collect) {
  const root = {}
  const generateBind = createUniqueIdGenerator('bind')
  let cnodesToStartReaction = new Set()

  function observeRender(render, cnode, ...argv) {
    // TODO use outer reaction because mobx reaction can not be nested.
    const [result, cacheFn] = cnode.reaction ?
      getCacheFnFromReactionProxy(cnode.reaction, () => cnode.state, () => render(cnode, ...argv)) :
      getReactionCacheFn(() => cnode.state, () => render(cnode, ...argv))
    cnode.reactionCacheFn = cacheFn
    cnodesToStartReaction.add(cnode)
    return result
  }

  function startReaction() {
    cnodesToStartReaction.forEach((cnode) => {
      const reaction = once(
        cnode.reactionCacheFn,
        () => {
          collect([cnode])
          delete cnode.cancelReaction
        },
      )[1]

      cnode.cancelReaction = () => {
        reaction.dispose()
        delete cnode.cancelReaction
      }
    })
    cnodesToStartReaction = new Set()
  }

  function attachStUtility(cnode, bind) {
    const intercepter = createStateIntercepter(cnode)

    cnode.st = {
      bind,
      attach(childBind, childCnode) {
        const success = exist.set(cnode.state, childBind.slice(), childCnode.state)
        if (!success) throw new Error(`attaching child state error ${childBind.join('.')}`)
        intercepter.interceptOnce(childBind, childCnode)
      },
      reportChild(childBind, childCnode) {
        // intercept
        intercepter.interceptOnce(childBind, childCnode)
      },
      detach(childBind) {
        intercepter.dispose(childBind)
      },
    }
  }

  function generateGetInitialState(cnode, bind) {
    // CAUTION cnode may not have parent.
    const parentGetDefaultState = (cnode.parent && cnode.parent.type.getDefaultState) ? cnode.parent.type.getDefaultState : () => ({})
    const propGetInitialState = cnode.props.getInitialState ? cnode.props.getInitialState : () => ({})

    // TODO need deepMerge
    const mergedInitialState = dump({
      ...cnode.type.getDefaultState(),
      ...exist.get(parentGetDefaultState(), bind, {}),
      ...propGetInitialState(),
    })
    return () => restore(mergedInitialState)
  }

  return {
    initialRender: next => (cnode, ...argv) => {
      // for debug
      if (cnode.State !== undefined) throw new Error('cnode has State Class already')

      // TODO need to support scope lift up. Layout component may not want to attach child component state in its own state. Maybe use scopeIndex = cnode.props.scopeIndex - 1?
      if (cnode.type.getDefaultState === undefined) cnode.type.getDefaultState = () => ({})
      const bind = ensureArray(cnode.props.bind || generateBind())
      const getInitialState = generateGetInitialState(cnode, bind)

      cnode.State = createStateClass(cnode.type, getInitialState)

      // 如果父组件上的值是被用户修改的，因此导致了当前组件
      const currentState = exist.get(cnode.parent.state, bind)
      // CAUTION Side effects.
      cnode.state = new cnode.State(currentState, cnode)


      if (cnode.parent.st) {
        cnode.parent.st.attach(bind, cnode)
      } else {
        root[bind.join('.')] = cnode.state
      }

      attachStUtility(cnode, bind)

      return observeRender(next, cnode, ...argv)
    },
    updateRender: next => (cnode, ...argv) => {
      // report this cnode anyway
      if (cnode.parent.st) {
        cnode.parent.st.reportChild(cnode.st.bind, cnode)
      }
      return observeRender(next, cnode, ...argv)
    },
    session: next => (sessionName, fn) => {
      next(sessionName, fn)
      startReaction()
    },
    // CAUTION User need to handle state right. We do not validate state anymore.
    // update() {
    //
    // }
    destroy: next => (cnode) => {
      next(cnode)
      if (cnode.cancelReaction) cnode.cancelReaction()
      if (cnode.parent.st) cnode.parent.st.detach(cnode.st.bind)
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
      getCnode(statePath) {
        return exist.get(root, statePath).getOwner()
      },
    },
  }
}
