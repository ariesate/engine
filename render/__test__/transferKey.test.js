import serialize from 'dom-serialize'
import { createElement, render } from '../src/index'

const initialCount = true

const Sub = {
  displayName: 'Sub',
  render() {
    return <div id="sub">sub</div>
  },
}

const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      count: initialCount,
    }
  },
  render({ state }) {
    if (state.count) {
      return (
        <div>
          <Sub transferKey="sub" />
        </div>
      )
    }

    return (
      <div>
        <div>
          <Sub transferKey="sub" />
        </div>
      </div>
    )
  },
}


const root = document.createElement('div')
document.body.appendChild(root)

const controller = render((
  <div>
    <Basic bind="basic" />
  </div>
), root)


describe('key test', () => {
  test('basic', () => {
    const subDom1 = document.getElementById('sub')
    expect(serialize(root)).toBe('<div><div><div><div id=\"sub\">sub</div></div></div></div>')
    controller.apply(() => {
      controller.getStateTree().api.get('basic').count = !initialCount
    })

    const subDom2 = document.getElementById('sub')

    expect(subDom1).toBe(subDom2)
    expect(serialize(root)).toBe('<div><div><div><div><div id=\"sub\">sub</div></div></div></div></div>')
  })
})
