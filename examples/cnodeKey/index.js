import { createElement, render } from '@ariesate/render'
import { serial } from '../common'

const Sub = {
  displayName: 'Sub',
  getDefaultState() {
    return {
      value: 0,
      payload: 'ssss',
    }
  },
  render({ state }) {
    return <div className="zoomIn animated">{state.value}</div>
  },
}

const initialCount = true

const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      count: initialCount,
      list: [{
        key: 1,
        value: 1,
      }, {
        key: 2,
        value: 2,
      }],
    }
  },
  render({ state }) {
    return (
      <div>
        {state.list.map((item, index) => <Sub key={item.key} bind={['list', index]} />)}
      </div>
    )
  },
}

const controller = render((
  <div>
    <Basic bind="basic" />
  </div>
), document.getElementById('root'))

window.controller = controller

serial([() => {
  const basic = controller.getStateTree().api.get('basic')
  controller.collect(() => {
    basic.list = basic.list.slice(0, 1).concat({ key: 3, value: 3 }, basic.list.slice(1))
  })

  // controller.getStateTree().api.set('basic.sub1', { index: 1 })
  // controller.getStateTree().api.set('basic.sub2', { index: 2 })
  // controller.getStateTree().api.merge('basic', { count: !initialCount })
}, () => {
  // controller.getStateTree().api.merge('basic', { count: initialCount })
}], 1000, () => {
  controller.repaint()
})
