import { createElement, render } from 'novice'

const Person = {
  displayName: 'Person',
  getDefaultState() {
    return {
      name: 'Jim',
    }
  },
  render({ state }) {
    return <div>name: {state.name}</div>
  },
}

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
      deep: {
        count: 0,
      },
      person: {},
    }
  },
  render({ state, children }) {
    return (
      <div>
        <span>
          world {state.count}
          world deep {state.deep.count}
        </span>
        {children}
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
  render({ children }) {
    return (
      <div>
        <span>Hello</span>
        {children}
      </div>
    )
  },
}

const controller = render((
  <div>
    <App bind="app">
      <World bind="world">
        <Person bind="person" />
      </World>
    </App>
  </div>
), document.getElementById('root'))

window.controller = controller

controller.apply(() => {
  // controller.getStateTree().api.get('app.world').count = 1
  controller.getStateTree().api.get('app.world').deep.count = 1
})
