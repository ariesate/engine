import serialize from 'dom-serialize'
import { createElement, render } from '../src/index'
import { findCnode } from './common'

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  render({ state }) {
    return (
      <div id="world">
        <span>
          world {state.count}
        </span>
        <div ref="spy" id="spy">1111</div>
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
        <World bind="world" ref="world" />
      </div>
    )
  },
}

const root = document.createElement('div')
document.body.appendChild(root)

const controller = render((
  <div>
    <App bind="app" />
  </div>
), root)

describe('basic test', () => {
  const ctree = controller.getCtree()
  test('dom ref', () => {
    const worldNode = findCnode(ctree, cnode => cnode.props.bind === 'world')
    expect(worldNode.view.getElements().spy).toBe(document.getElementById('spy'))
  })

  test('component ref', () => {
    const worldNode = findCnode(ctree, cnode => cnode.props.bind === 'app')
    expect(worldNode.view.getElements().world.length).toBe(1)
    expect(worldNode.view.getElements().world[0]).toBe(document.getElementById('world'))
  })
})

