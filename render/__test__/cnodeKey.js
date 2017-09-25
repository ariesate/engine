import serialize from 'dom-serialize'
import { createElement, render } from '../src/index'

const Sub = {
  displayName: 'Sub',
  getDefaultState() {
    return {
      key: 0,
      value: 0,
      payload: '$',
    }
  },
  render({ state }) {
    return <div id={`sub-${state.key}`}>{state.value}</div>
  },
}


const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      list: [{
        key: 1,
        value: 1,
      }, {
        key: 2,
        value: 2,
      }],
    }
  },
  render({ state }) {
    return (
      <div id="list">
        {state.list.map((item, index) => <Sub key={item.key} bind={['list', index]} />)}
      </div>
    )
  },
}

const root = document.getElementById('root')
document.body.appendChild(root)

const controller = render((
  <div>
    <Basic bind="basic" />
  </div>
), root)

describe('cnodeKey test', () => {
  test('add one and change the rest', () => {
    const lastDomRef1 = document.getElementById('sub-1')
    const lastDomRef2 = document.getElementById('sub-2')

    const basic = controller.getStateTree().api.get('basic')
    controller.collect(() => {
      basic.list = basic.list.slice(0, 1).concat({ key: 3, value: 3 }, basic.list.slice(1))
      basic.list[0].value = 111
      basic.list[2].value = 222
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('sub-1'))
    expect(lastDomRef2).toBe(document.getElementById('sub-2'))
    expect(document.getElementById('list').childNodes.length).toBe(3)
    expect(lastDomRef1).toBe(document.getElementById('list').childNodes[0])
    expect(lastDomRef2).toBe(document.getElementById('list').childNodes[2])
    expect(document.getElementById('list').childNodes[1]).toBe(document.getElementById('sub-3'))
  })
})
