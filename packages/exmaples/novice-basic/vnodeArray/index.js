import { createElement, render } from 'novice'
import { serial } from '../common'


const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      list: [1, 2, 3],
    }
  },
  render({ state }) {
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
  controller.collect(() => {
    controller.getStateTree().api.get('basic').list = [1, 2, 3, 4]
  })
}, () => {
  controller.collect(() => {
    controller.getStateTree().api.get('basic').list = [1, 2]
  })
}, () => {
  controller.collect(() => {
    controller.getStateTree().api.get('basic').list = [3, 2, 1]
  })
}], 1000, () => {
  controller.repaint()
})
