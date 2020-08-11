// TODO 没有就写出来的 vnodeComputed。
const { ref, reactive, refComputed, objectComputed, arrayComputed } = require('../reactive/index.js')
const { createElement, Fragment, render } = require('../index.js')

describe('basic render', () => {

  test('reactive text', () => {
    const name = ref('tim')
    let rendered = 0

    function App() {
      rendered += 1
      return <div>{name}</div>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(root.textContent).toBe('tim')
    expect(rendered).toBe(1)

    name.value = 'tom'
    expect(root).toHaveTextContent('tom')
    // 不需要再渲染
    expect(rendered).toBe(1)
  })

  test('reactive props', () => {


  })

  test('reactive vnode(vnodeComputed)', () => {


  })
})
