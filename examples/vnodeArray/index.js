import { createElement, render } from '@ariesate/render'
import { serial } from '../common'


const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      list: [1, 2, 3],
    }
  },
  render({ state }) {
    console.log('update', state)
    return (
      <div>
        {state.list.map(s => (<div key={s} className="zoomIn animated">{s}</div>))}
      </div>
    )
  },
}

const controller = render((
  <div>
    <h1>basic</h1>
    <Basic bind="basic" />
  </div>
), document.getElementById('root'))

window.controller = controller

serial([() => {
  controller.getStateTree().api.set('basic', { list: [1, 2, 3, 4] })
}, () => {
  controller.getStateTree().api.set('basic', { list: [1, 2] })
}, () => {
  controller.getStateTree().api.set('basic', { list: [3, 1, 2] })
}], 1000, () => {
  controller.repaint()
})
