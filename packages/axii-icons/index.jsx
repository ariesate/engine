/**@jsx createElement */
import { createElement, render  } from 'axii'
import AddOne from './dist/HamburgerButton'

function App( ) {
  return <AddOne />
}

render(<App />, document.getElementById('root'))
