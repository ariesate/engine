function handleInitialCnode(cnode, parentContainer) {
  // 渲染当前节点
  patch(cnode.ret, parentContainer)

  if (cnode.ret.children) {
    // 递归渲染。
    // TODO 何时更新？这里的规则到底算在谁的上面
  }

}

export default function digest(cnode, view) {
  const fragment = view.createFragment()
  handleInitialCnode(cnode, fragment)
}