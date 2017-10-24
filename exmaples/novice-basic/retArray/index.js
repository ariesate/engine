import { createElement, render } from 'novice'


const App = {
  displayName: 'App',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  render({ state }) {
    return state.count === 0 ?
      <span>no</span> :
      [
        <span>Hello</span>,
        <span>World</span>,
      ]
  },
}

const controller = render((
    <App bind="app">aaaa</App>
), document.getElementById('root'))

window.controller = controller

controller.apply(() => {
  controller.getStateTree().api.get('app').count = 1
})
