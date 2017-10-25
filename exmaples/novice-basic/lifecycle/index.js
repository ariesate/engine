import { createElement, render } from 'novice'

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  lifecycle: {
    beforePaint(...argv) {
      console.log('before paint', ...argv)
    },
    afterPaint(...argv) {
      console.log('after paint', ...argv)
    },
    beforeInitialDigest(...argv) {
      console.log('before digest', ...argv)
    },
    afterInitialDigest(...argv) {
      console.log('after digest', ...argv)
    },
    beforeUpdateDigest(...argv) {
      console.log('before update digest', ...argv)
    },
    afterUpdateDigest(...argv) {
      console.log('after update digest', ...argv)
      const { state } = argv[0]
      if (state.count !== 2) state.count = 2
    },
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
  getDefaultState() {
    return {
      world: {},
    }
  },
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
  controller.getStateTree().api.get('app.world').count = 1
})
