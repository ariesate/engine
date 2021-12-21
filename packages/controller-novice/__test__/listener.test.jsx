import serialize from 'dom-serialize'
import { createElement, render } from '../src/index'

const Sub = {
  displayName: 'Sub',
  getDefaultState() {
    return {
      value: 0,
      payload: 'ssss',
    }
  },
  render({ state }) {
    return <div>{state.value}</div>
  },
}

const initialCount = true

const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      count: initialCount,
      list: [{
        key: 0,
        value: 0,
      }, {
        key: 1,
        value: 1,
      }],
    }
  },
  listeners: {
    addOne({ state }) {
      state.list = state.list.concat({ key: state.list.length, value: state.list.length })
    },
  },
  render({ state, listeners }) {
    return (
      <div>
        {state.list.map((item, index) => <Sub key={item.key} bind={['list', index]} />)}
        <button onClick={listeners.addOne} id="addButton">add one</button>
      </div>
    )
  },
}

const root = document.createElement('div')
document.body.appendChild(root)

render((
  <Basic bind="basic" />
), root, {}, {}, {})

describe('listener', () => {
  test('mimic button click', () => {
    const button = document.getElementById('addButton')
    button.click()
    expect(serialize(root)).toBe('<div><div><div>0</div><div>1</div><div>2</div><button id=\"addButton\">add one</button></div></div>')
    button.click()
    expect(serialize(root)).toBe('<div><div><div>0</div><div>1</div><div>2</div><div>3</div><button id=\"addButton\">add one</button></div></div>')
  })
})

