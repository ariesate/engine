import serialize from 'dom-serialize'
import { createElement, render } from '../src/index'

const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      list: [1, 2, 3],
    }
  },
  render({ state }) {
    return (
      <div>
        {state.list.map(s => (<div key={s}>{s}</div>))}
      </div>
    )
  },
}

const root = document.createElement('div')

render((
  <div>
    <h1>basic</h1>
    <Basic bind="basic" />
  </div>
), root)

describe('vnodeArray test', () => {
  test('render right', () => {
    expect(serialize(root)).toBe('<div><div><h1>basic</h1><div><div>1</div><div>2</div><div>3</div></div></div></div>')
  })
})
