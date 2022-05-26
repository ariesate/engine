/**@jsx createElement */
import {createElement, createComponent, atom, atomComputed, propTypes} from 'axii'

function SidebarLayout({ showSidebar, children }) {
  return <container block block-height="100%" flex-display flex-display>
    <sidebar block block-width-200px block-display-none={atomComputed(() => !showSidebar.value)}>{children.sidebar}</sidebar>
    <content block flex-grow-1 block-width-600px block-overflow-auto >{children.content}</content>
  </container>
}

SidebarLayout.propTypes = {
  showSidebar: propTypes.bool.default(() => atom(false)),
  children: propTypes.shapeOf({
    sidebar: propTypes.element(),
    content: propTypes.element(),
  })
}

SidebarLayout.useNamedChildrenSlot = true

export default createComponent(SidebarLayout)
