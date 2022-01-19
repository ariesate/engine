/**@jsx createElement */
import {createElement, createComponent, propTypes, isVnodeComputed} from 'axii'

function Vbox({ children }) {
  return <vbox block flex-display flex-direction-column>{children}</vbox>
}

Vbox.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(Vbox)
