import { createElement, render } from '@ariesate/render'
import * as mstMod from '@ariesate/render/noviceController/moduleSystem/modules/mst'

const { types } = mstMod

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  render({ state }) {
    return (
      <div>
        <span>
          world {state.count}
        </span>
        <div ref="spy">1111</div>
      </div>
    )
  },
}

const App = {
  displayName: 'App',
  render() {
    return (
      <div>
        <span>Hello</span>
        <World bind="world" mapMSTToState={({mst: root}) => ({ count: root.count })} />
      </div>
    )
  },
}

const modelDefs = {
  Root: types.model({
    count: types.number,
  }),
}

const initialMSTState = {
  count: 3,
}

const controller = render((
  <div>
    <App bind="app">aaaa</App>
  </div>
), document.getElementById('root'), { mst: { ...mstMod, argv: [{ rootType: 'Root', modelDefs, initialState: initialMSTState }] } })

window.controller = controller

controller.apply(() => {
  controller.instances.mst.api.root.set('count', 2)
})
