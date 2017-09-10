import { createElement, render } from '@ariesate/render'
import { ctreeToVtree, vtreeToHTML } from '../common'

let count = 0

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0
    }
  },
  render({state}) {
    return <div>world {state.count}</div>
  }
}

const App = {
  displayName: 'App',
  render() {
    return <div>
      <span>Hello</span>
      <World bind='world'/>
      </div>
  }
}

const controller = render((
  <div>
    <App>aaaa</App>
  </div>
), document.getElementById('root'))

console.log(vtreeToHTML(ctreeToVtree(controller.getCtree())))

controller.onChange(ctree => {
  console.log(vtreeToHTML(ctreeToVtree(ctree)))
})

