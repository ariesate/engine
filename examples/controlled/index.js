import { createElement, render } from '@ariesate/render'
import * as listenerMod from '@ariesate/render/noviceController/modules/listener'

const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      value: 11111,
    }
  },
  listeners: {
    onChange({ state }, e) {
      console.log("onChange")
      state.value = e.target.value + 2
    },
  },
  render({ state, listeners }) {
    console.log('rendering', state.value)
    return (
      <div>
        <input value={state.value} onChange={listeners.onChange} />
      </div>
    )
  },
}

const controller = render((
  <div>
    <Basic bind="basic" />
  </div>
), document.getElementById('root'), {}, {}, { listeners: listenerMod })

window.controller = controller
