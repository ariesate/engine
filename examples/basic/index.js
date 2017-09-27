import { createElement, render } from '@ariesate/render'

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  render({ state, refs, viewRefs }) {
    console.log(arguments)
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
        <World bind="world" />
      </div>
    )
  },
}

const controller = render((
  <div>
    <App bind="app">aaaa</App>
  </div>
), document.getElementById('root'))

window.controller = controller

controller.collect(() => {
  controller.getStateTree().api.get('app.world').count = 1
})

controller.repaint()
