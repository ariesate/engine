/*
cnode: component tree node
ctree: component tree root
vnode: virtual dom node
 */

/*
1. controller 对外提供 paint/repaint 接口，并且能由外部决定是否递归(这样就能同时满足 react 和 cicada 模式)
2. renderer 作为 controller 的一部分， 由 controller 统一对外提供 ref/$digest(可由外部控制何时重绘) 等服务。
这样能同时支持 react 的正常渲染，同时支持 cicada 要多次 render 再渲染的场景。之后如果有更强的功能，
比如 fiber，那么也能通过增强 renderer 实现。
 */


function paint(cnode, painter, intercepter) {
  const nextToPaint = Object.values(intercepter.intercept(painter.handle(cnode), cnode))
  nextToPaint.forEach((subCnode) => {
    paint(subCnode, painter, intercepter)
  })
}


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
