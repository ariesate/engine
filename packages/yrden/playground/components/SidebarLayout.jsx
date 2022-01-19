/**@jsx createElement */
import {createElement, createComponent, atom, atomComputed, propTypes} from 'axii'

function SidebarLayout({ showSidebar }) {
  return <container block block-height="100%" flex-display flex-display>
    {() => showSidebar.value ? <sidebar slot block block-width-200px></sidebar> : null}
    <content slot block flex-grow-1 block-width-600px block-overflow-y-auto flex-align-self-center>{showSidebar}</content>
  </container>
}

SidebarLayout.propTypes = {
  showSidebar: propTypes.bool.default(() => atom(false)),
  children: propTypes.shapeOf({
    sidebar: propTypes.element,
    content: propTypes.element,
  })
}

SidebarLayout.useNamedChildrenSlot = true

export default createComponent(SidebarLayout)
