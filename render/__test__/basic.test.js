import serialize from 'dom-serialize'
import { createElement, render } from '../src/index'

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
        <World bind="world" />
      </div>
    )
  },
}

const root = document.createElement('div')

const controller = render((
  <div>
    <App bind="app">should not show</App>
  </div>
), root)

describe('basic test', () => {
  test('basic', () => {
    expect(serialize(root)).toBe('<div><div><div><span>Hello</span><div><span>world 0</span><div>1111</div></div></div></div></div>')
    controller.apply(() => {
      controller.getStateTree().api.get('app.world').count = 1
    })
    expect(serialize(root)).toBe('<div><div><div><span>Hello</span><div><span>world 1</span><div>1111</div></div></div></div></div>')
  })
})

