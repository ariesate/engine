import { walkCnodes } from './common'
import { each } from './util'

function createTrackingTree() {
  let locked = false
  let root = null

  function track(cnode, isAncestor = false) {
    if (locked) throw new Error(`tracking tree locked, trying to track ${cnode.type.displayName}`)
    if (cnode.trackNode !== undefined) return
    const trackNode = { tracking: !isAncestor, owner: cnode, children: new Set() }
    cnode.trackNode = trackNode
    if (!cnode.parent) {
      root = trackNode
    } else {
      if (cnode.parent.trackNode === undefined) track(cnode.parent, true)
      cnode.trackNode.parent = cnode.parent.trackNode
      cnode.parent.trackNode.children.add(cnode.trackNode)
    }
  }

  function dispose(cnode, noNeedRecursive = false) {
    if (cnode.trackNode === undefined) throw new Error(`cnode is not in tracking tree ${cnode.type.displayName}`)
    if (!noNeedRecursive) {
      cnode.trackNode.children.forEach(childTrackRef => dispose(childTrackRef.owner))
    }
    if (cnode.trackNode.parent) {
      cnode.trackNode.parent.children.delete(cnode.trackNode)
      delete cnode.trackNode.parent
    }
    delete cnode.trackNode.owner
    delete cnode.trackNode.children
    delete cnode.trackNode
  }

  function walk(trackNode, handler, shouldDispose) {
    if (trackNode.tracking) handler(trackNode.owner)
    trackNode.children.forEach(childTrackNode => walk(childTrackNode, handler, shouldDispose))
    if (shouldDispose) dispose(trackNode.owner, true)
  }

  return {
    lock: () => locked = true,
    unlock: () => locked = false,
    track,
    dispose,
    walk(handler, shouldDispose) {
      if (root === null) return
      walk(root, handler, shouldDispose)
      if (shouldDispose) {
        root = null
      }
    },
  }
}

const SESSION_INITIAL = 'session.initial'
const SESSION_UPDATE = 'session.update'
const UNIT_PAINT = 'unit.paint'
const UNIT_REPAINT = 'unit.repaint'
const UNIT_INITIAL_DIGEST = 'unit.initialDigest'
const UNIT_UPDATE_DIGEST = 'unit.updateDigest'

// 用户的 apply 表示一个用户已知的原子粒度的操作，并且希望启动一个 session。
// 这里设计的关联在于 module 是否完整知道 session 的概念。既然有 session 的概念，当然是知道。

export default function createScheduler(painter, view, supervisor) {
  let ctree
  // trackingTree 的目的是解决 "先 collect 了父节点，后 collect了子节点，但父节点执行后，其实要 destroy 子节点"。
  // 还有可能 先 collect 了子节点，后 collect 了父节点，父节点在执行后删除了子节点，子节点先更新的话就浪费资源了。
  const trackingTree = createTrackingTree()
  let inUpdateSession = false

  function startUpdateSession(fn) {
    // expect collect cnodes
    fn()
    if (inUpdateSession) return

    supervisor.session(SESSION_UPDATE, () => {
      inUpdateSession = true
      trackingTree.walk((cnode) => {
        const unit = cnode.isPainted ? UNIT_REPAINT : UNIT_PAINT
        supervisor.unit(unit, cnode, () => {
          const paintMethod = cnode.isPainted ? painter.repaint : painter.paint
          const { toPaint = {}, toRepaint = {}, toDispose = {} } = supervisor.filterNext(paintMethod(cnode), cnode)
          each(toPaint, toPaintCnode => trackingTree.track(toPaintCnode))
          each(toRepaint, toRepaintCnode => trackingTree.track(toRepaintCnode))
          each(toDispose, toDisposeCnode => trackingTree.dispose(toDisposeCnode, true))
        })
      })
      trackingTree.lock()
      trackingTree.walk((cnode) => {
        const unit = cnode.isDigested ? UNIT_UPDATE_DIGEST : UNIT_INITIAL_DIGEST
        supervisor.unit(unit, cnode, () => {
          const digestMethod = cnode.isDigested ? view.updateDigest : view.initialDigest
          digestMethod(cnode)
        })
      }, true) // the second argument will consume the tree
      trackingTree.unlock()
      inUpdateSession = false
    })
  }

  function startInitialSession(vnode) {
    supervisor.session(SESSION_INITIAL, () => {
      ctree = painter.createCnode({
        type: { render: () => vnode },
      })

      walkCnodes([ctree], (cnode) => {
        supervisor.unit(UNIT_PAINT, cnode, () => {
          // initialize will create cnode.next, so walkCnode will go on.
          painter.paint(cnode)
        })
      })

      walkCnodes([ctree], (cnode) => {
        supervisor.unit(UNIT_INITIAL_DIGEST, cnode, () => {
          view.initialDigest(cnode)
        })
      })
    })

    // start a update session immediately, because
    return ctree
  }

  return {
    startInitialSession,
    startUpdateSession,
    collectChangedCnodes: cnodes => cnodes.forEach(trackingTree.track),
  }
}
