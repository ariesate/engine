import { createElement, render } from '@ariesate/render'
import { ctreeToVtree, vtreeToHTML } from '../common'

const World = {
  displayName: 'World',
  getDefaultState() {
    return {
      count: 0,
    }
  },
  render({ state, refs, viewRefs }) {
    console.log(refs, viewRefs)
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
    <App>aaaa</App>
  </div>
), document.getElementById('root'))


controller.onChange((ctree) => {
  console.log(vtreeToHTML(ctreeToVtree(ctree)))
})

