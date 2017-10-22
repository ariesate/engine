/**
 * Variable Name Convention
 * cnode: component tree node
 * ctree: component tree root node
 *
 * Scheduler controls the queue of cnode that waits to be paint.
 * If you want to implement different scheduling strategy like fiber, here is the place to do it.
 */

/**
 * Paint current cnode, and recursively invoke self for next cnodes(usually child cnodes).
 * It receives a painter object as argument, which paints cnode to vnode.
 * In this version of scheduler, you may pass a intercepter object to
 * intercept the next cnodes to be paint.
 *
 * @param cnode
 * @param painter
 * @param intercepter
 */
function paint(cnode, painter, intercepter) {
  const nextToPaint = Object.values(intercepter.intercept(painter.handle(cnode), cnode))
  nextToPaint.forEach((subCnode) => {
    paint(subCnode, painter, intercepter)
  })
}

/**
 * The scheduler for controller to use.
 *
 * @param painter
 * @param intercepter
 * @returns {{paint: firstPaint, repaint: repaint}}
 */
export default function createScheduler(painter, intercepter) {
  function repaint(cnodeRefs) {
    cnodeRefs.forEach((cnodeRef) => {
      paint(cnodeRef, painter, intercepter)
    })
  }

  function firstPaint(vnode) {
    const ctree = painter.createCnode({
      type: { render: () => vnode },
    })
    paint(ctree, painter, intercepter)
    return ctree
  }

  return {
    paint: firstPaint,
    repaint,
  }
}
