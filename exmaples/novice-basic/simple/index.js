import { createElement, render } from 'novice'

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
      deep: {
        count: 0,
      },
    }
  },
  render({ state }) {
    return (
      <div>
        <span>
          world {state.count}
          world deep {state.deep.count}
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

controller.apply(() => {
  // controller.getStateTree().api.get('app.world').count = 1
  controller.getStateTree().api.get('app.world').deep.count = 1
})
