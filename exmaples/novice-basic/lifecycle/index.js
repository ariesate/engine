import { createElement, render } from 'novice'

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  hookBeforePaint(...argv) {
    console.log('before paint', ...argv)
  },
  hookAfterPaint(...argv) {
    console.log('after paint', ...argv)
  },
  hookBeforeInitialDigest(...argv) {
    console.log('before digest', ...argv)
  },
  hookAfterInitialDigest(...argv) {
    console.log('after digest', ...argv)
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
