/**@jsx createElement */
import {createElement, createComponent, propTypes} from 'axii'

function Vbox({ children }) {
  return <vbox block flex-display flex-direction-column block-min-width-100px block-min-height-100px>{children}</vbox>
}

Vbox.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(Vbox)
