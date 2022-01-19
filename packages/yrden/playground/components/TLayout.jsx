/**@jsx createElement */
import {createElement, createComponent, atom, atomComputed, propTypes} from 'axii'

function TLayout({ showHeader }) {
  return <container block block-height="100%" flex-display flex-direction-column>
    <header slot block flex-grow-0 flex-shrink-0 block-height={atomComputed(() => showHeader.value ? '50px' : 0)}></header>
    <content slot block flex-grow-1 block-width-600px block-overflow-y-auto flex-align-self-center></content>
  </container>
}

TLayout.propTypes = {
  showHeader: propTypes.bool.default(() => atom(true)),
  children: propTypes.shapeOf({
    header: propTypes.element(),
    content: propTypes.element()
  })
}

export default createComponent(TLayout)

