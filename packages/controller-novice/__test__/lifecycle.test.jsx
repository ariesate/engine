import serialize from 'dom-serialize'
import { createElement, render } from '../src/index'

let beforePaintFired = false
let afterPaintFired = false
let beforeInitialDigestFired = false
let afterInitialDigestFired = false
let beforeRepaintFired = false
let afterRepaintFired = false
let beforeUpdateDigestFired = false
let afterUpdateDigestFired = false

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  lifecycle: {
    beforePaint(...argv) {
      beforePaintFired = argv
    },
    afterPaint(...argv) {
      afterPaintFired = argv
    },
    beforeRepaint(...argv) {
      beforeRepaintFired = argv
    },
    afterRepaint(...argv) {
      afterRepaintFired = argv
    },
    beforeInitialDigest(...argv) {
      beforeInitialDigestFired = argv
    },
    afterInitialDigest(...argv) {
      afterInitialDigestFired = argv
    },
    beforeUpdateDigest(...argv) {
      beforeUpdateDigestFired = argv
    },
    afterUpdateDigest(...argv) {
      afterUpdateDigestFired = argv
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

const root = document.createElement('div')

const controller = render((
  <div>
    <App bind="app">should not show</App>
  </div>
), root)

describe('basic test', () => {
  test('basic', () => {
    expect(serialize(root)).toBe('<div><div><div><span>Hello</span><div><span>world 0</span><div>1111</div></div></div></div></div>')
    expect(beforePaintFired).not.toBe(false)
    expect(afterPaintFired).not.toBe(false)
    expect(beforeInitialDigestFired).not.toBe(false)
    expect(afterInitialDigestFired).not.toBe(false)
    expect(beforeRepaintFired).toBe(false)
    expect(afterRepaintFired).toBe(false)
    expect(beforeUpdateDigestFired).toBe(false)
    expect(afterUpdateDigestFired).toBe(false)
    controller.apply(() => {
      controller.getStateTree().api.get('app.world').count = 1
    })
    expect(serialize(root)).toBe('<div><div><div><span>Hello</span><div><span>world 2</span><div>1111</div></div></div></div></div>')
    expect(beforeRepaintFired).not.toBe(false)
    expect(afterRepaintFired).not.toBe(false)
    expect(beforeUpdateDigestFired).not.toBe(false)
    expect(afterUpdateDigestFired).not.toBe(false)
  })
})

