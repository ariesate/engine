/** @jsx createElement */
import { createElement, render, reactive, atomComputed, atom } from 'axii'
import { useLayer, Button } from 'axii-components'

function App() {

  const visible = atom(false)


  const style = atomComputed(() => ({
    left: 0,
    top: 0,
    height: document.body.offsetHeight,
    width: document.body.offsetWidth,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0,0,0, .2)'
  }))

  const { node } = useLayer(<div style={style}>
    <div>show message in page center</div>
    <div>
      <Button onClick={() => visible.value = false}>Close</Button>
    </div>
  </div>, { visible })

  return (
    <div>
      <Button onClick={() => visible.value = true}>open modal</Button>
      {node}
    </div>
  )
}

render(<App />, document.getElementById('root'))
