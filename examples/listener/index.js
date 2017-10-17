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
        key: 0,
        value: 0,
      }, {
        key: 1,
        value: 1,
      }],
    }
  },
  listeners: {
    addOne({ state }) {
      state.list = state.list.concat({ key: state.list.length, value: state.list.length })
    },
  },
  render({ state, listeners }) {
    return (
      <div>
        {state.list.map((item, index) => <Sub key={item.key} bind={['list', index]} />)}
        <button onClick={listeners.addOne}>add one</button>
      </div>
    )
  },
}

const controller = render((
  <div>
    <Basic bind="basic" />
  </div>
), document.getElementById('root'), {}, {})

window.controller = controller

serial([() => {
  const basic = controller.getStateTree().api.get('basic')
  controller.apply(() => {
    // basic.list = basic.list.slice(0, 1).concat({ key: 3, value: 3 }, basic.list.slice(1))
  })

  // controller.getStateTree().api.set('basic.sub1', { index: 1 })
  // controller.getStateTree().api.set('basic.sub2', { index: 2 })
  // controller.getStateTree().api.merge('basic', { count: !initialCount })
}, () => {
  // controller.getStateTree().api.merge('basic', { count: initialCount })
}], 1000, () => {
  // controller.repaint()
})
