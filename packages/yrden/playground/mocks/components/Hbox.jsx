/**@jsx createElement */
import {createElement, createComponent, propTypes} from 'axii'

function Hbox({ children }) {
  return <hbox block flex-display flex-direction-row slot block-min-height-100px block-border-width-1px>{children}</hbox>
}

Hbox.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}


export default createComponent(Hbox)
