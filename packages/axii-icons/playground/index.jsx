/**@jsx createElement */
import { createElement, render  } from 'axii'
import AddOne from 'axii-icons/AddOne'

function App( ) {
  return <AddOne />
}

render(<App />, document.getElementById('root'))
