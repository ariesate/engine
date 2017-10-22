/**
 * Variable Name Convention
 * cnode: component tree node
 * ctree: component tree root node
 *
 * Description Of Scheduler
 * Scheduler decides when to paint cnode.  It receives a painter object as argument,
 * which do the painting, in another word, invoking the render method.
 * In this scheduler, it also receive a intercepter object to decide the next cnodes to paint.
 * If you want to implement fiber strategy, here is the place to do it.
 */

/**
 * The method to paint one cnode, and invoke the next cnodes to paint.
 * @param cnode The  cnode that its render method will be invoked.
 * @param painter The object that invoke cnode's render method
 * @param intercepter The object that decides the next cnodes to paint.
 */
function paint(cnode, painter, intercepter) {
  const nextToPaint = Object.values(intercepter.intercept(painter.handle(cnode), cnode))
  nextToPaint.forEach((subCnode) => {
    paint(subCnode, painter, intercepter)
  })
}

/**
 * The scheduler, as part of controller.
 * @param painter
 * @param intercepter
 * @returns {{paint: firstPaint, repaint: repaint}}
 */
export default function createScheduler(painter, intercepter) {
  // 1. 子组件可能由于父组件重绘而不再需要绘制
  function repaint(cnodeRefs) {
    cnodeRefs.forEach((cnodeRef) => {
      paint(cnodeRef, painter, intercepter)
    })
  }

  function firstPaint(vnode) {
    const ctree = {
      type: { render: () => vnode },
      props: {},
      children: [],
    }
    paint(ctree, painter, intercepter)
    return ctree
  }

  return {
    paint: firstPaint,
    repaint,
  }
}
