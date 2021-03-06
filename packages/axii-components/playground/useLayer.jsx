/** @jsx createElement */
import { createElement, render, reactive, atomComputed, atom } from 'axii'
import useLayer from '../src/hooks/useLayer.jsx'

function App() {

  const visible = atom(false)


  const style = atomComputed(() => ({
    left: 0,
    top: 0,
    height: document.body.offsetHeight,
    width: document.body.offsetWidth,
    display: visible.value ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0,0,0, .2)'
  }))

  const { node } = useLayer(<div style={style}>
    <div>show message in page center</div>
    <div>
      <button onClick={() => visible.value = false}>Close</button>
    </div>
  </div>)

  return (
    <div>
      <button onClick={() => visible.value = true}>open modal</button>
      {node}
    </div>
  )
}

render(<App />, document.getElementById('root'))
