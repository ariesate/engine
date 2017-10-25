import { walkCnodes } from './common'
import { each } from './util'
import {
  SESSION_INITIAL,
  SESSION_UPDATE,
  UNIT_PAINT,
  UNIT_REPAINT,
  UNIT_INITIAL_DIGEST,
  UNIT_UPDATE_DIGEST,
} from './constant'
import createTrackingTree from './createTrackingTree'


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
    if (trackingTree.isEmpty()) return

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
