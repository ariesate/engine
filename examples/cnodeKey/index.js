import { createElement, render } from '@ariesate/render'
import { serial } from '../common'

const Sub = {
  displayName: 'Sub',
  getDefaultState() {
    return {
      value: 0,
      payload: '$',
    }
  },
  render({ state }) {
    return <div className="zoomIn animated">{state.value}</div>
  },
}


const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
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
  controller.apply(() => {
    basic.list = basic.list.slice(0, 1).concat({ key: 3, value: 3 }, basic.list.slice(1))
    basic.list[0].value = 111
    basic.list[2].value = 222
  })
}, () => {
}], 1000, () => {
})
