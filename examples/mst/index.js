import { createElement, render } from '@ariesate/render'
import * as mstMod from '@ariesate/render/noviceController/moduleSystem/modules/mst'
import { once } from '@ariesate/render/noviceController/moduleSystem/modules/stateTree/once'

const { autorun, types } = mstMod

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  render({ state, mst }) {
    console.log("rendering", state, mst.count)
    // console.log("renering", controller.instances.mst.api.root.count)
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
        <World bind="world" mapMSTToState={root => ({ count: root.count })} />
      </div>
    )
  },
}

const modelDefs = {
  Root: {
    count: types.number,
  },
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

autorun(() => {
  console.log("auto run count >>>>", controller.instances.mst.api.root.count)
})

// once(() => {
//   console.log("track once", controller.instances.mst.api.root.count)
// }, () => {
//   console.log("track listener fire")
// })

controller.apply(() => {
  controller.instances.mst.api.root.set('count', 2)
})
