/** @jsx createElement */
import { createElement, render, reactive, atomComputed, ref } from 'axii'
import useLayer from '../src/hooks/useLayer.jsx'

function App() {

  const visible = ref(false)


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
    <div>这是要居中显示的</div>
    <div>
      <button onClick={() => visible.value = false}>关闭</button>
    </div>
  </div>)

  return (
    <div>
      <button onClick={() => visible.value = true}>打开 modal</button>
      {node}
    </div>
  )
}

render(<App />, document.getElementById('root'))
