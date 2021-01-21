/** @jsx createElement */
import { render, createElement } from 'axii'
import { NodeView } from '@antv/x6'
import ViewContext from './context'

export const axiiAction = 'axii'

export class AxiiShapeView extends NodeView {
  init() {
    super.init()
  }

  getComponentContainer() {
    return this.selectors.foContent
  }

  confirmUpdate(flag) {
    const ret = super.confirmUpdate(flag)
    return this.handleAction(ret, axiiAction, () =>
      this.renderAxiiComponent(),
    )
  }

  renderAxiiComponent() {
    this.unmountAxiiComponent()
    const root = this.getComponentContainer()
    const node = this.cell
    const graph = this.graph

    if (root) {
      const Component = this.graph.hook.getAxiiComponent(node)
      const props = node.data || {}
      this.controller = render(<ViewContext.Provider value={{graph, node}}>
        <Component {...props}/>
      </ViewContext.Provider>, root)
      console.log(root, root.scrollWidth, root.scrollHeight)
      // TODO 强行同步一下 size。x6 没有做这件事。 在 change 的时候也要同步 size 才行。resize observer。
      node.prop({ size: {width: root.scrollWidth, height: root.scrollHeight}})
    }
  }

  unmountAxiiComponent() {
    if (this.controller) {
      this.controller.destroy()
      this.controller = null
    }
    const root = this.getComponentContainer()
    root.innerHTML = ''
    return root
  }

  dispose() {
    super.dispose()
    this.unmountAxiiComponent()
  }
}



AxiiShapeView.config({
  bootstrap: [axiiAction],
  actions: {
    component: axiiAction,
  },
})

NodeView.registry.register('axii-shape-view', AxiiShapeView, true)
