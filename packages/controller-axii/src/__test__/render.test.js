import { vnodeComputed, createElement } from '../index';
import $ from 'jquery'

const { ref, reactive, refComputed, objectComputed, arrayComputed, delegateLeaf } = require('../reactive/index.js')
const { render } = require('../index.js')

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
    expect($(root).children().get(0)).partialMatch(<div>tom</div>)
  })

  test('reactive props', () => {

    const base = ref(1)
    let rendered = 0

    function App() {
      rendered += 1
      const style = refComputed(() => {
        return {
          color: base.value === 1 ? 'red' : 'blue'
        }
      })
      return <div style={style} />
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(root.children[0]).toHaveStyle({color: 'red'})
    expect(rendered).toBe(1)

    base.value = 2
    expect(root.children[0]).toHaveStyle({color: 'blue'})
    // 不需要再渲染
    expect(rendered).toBe(1)

  })

  test('reactive vnode(vnodeComputed)', () => {
    // TODO 没有使用 vnodeComputed 包裹的动态节点，可能会收集到错误的 cnode。
    const list = reactive([1, 2])
    let rendered = 0

    function App() {
      rendered += 1
      return <div>{ vnodeComputed(() => {
        return list.map((num, index) => {
          return <span key={index}>{num}</span>
        })
      })}</div>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(root.children[0].children.length).toBe(list.length)
    expect(rendered).toBe(1)

    list.push(3)

    expect($(root).children().get(0)).partialMatch(
      <div>
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
    )

    // 不需要再渲染
    expect(rendered).toBe(1)
  })

  test('pass reactive to child component', () => {
    let rendered = 0
    let childRendered = 0

    const person = reactive({
      firstName: 'john',
      secondName: 'doe'
    })

    function App() {
      rendered += 1
      return <div>
        <Child name={delegateLeaf(person).firstName} />
        <span>-</span>
        <Child name={delegateLeaf(person).secondName} />
      </div>
    }

    const childResetFns = []

    function Child({ name }) {
      childResetFns.push(() => {
        name.value = 'reset'
      })
      childRendered += 1
      return <span>{name}</span>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(rendered).toBe(1)
    expect(childRendered).toBe(2)
    expect($(root).children().get(0)).partialMatch(
      <div>
        <span>john</span>
        <span>-</span>
        <span>doe</span>
      </div>
    )

    person.firstName = 'tim'
    expect(rendered).toBe(1)
    expect(childRendered).toBe(2)
    expect($(root).children().get(0)).partialMatch(
      <div>
        <span>tim</span>
        <span>-</span>
        <span>doe</span>
      </div>
    )

    // reset values
    childResetFns.forEach(fn => fn())
    expect(rendered).toBe(1)
    expect(childRendered).toBe(2)
    expect($(root).children().get(0)).partialMatch(
      <div>
        <span>reset</span>
        <span>-</span>
        <span>reset</span>
      </div>
    )
    expect(person.firstName).toBe('reset')
    expect(person.secondName).toBe('reset')
  })

  test('children proxy', () => {
    // 读取了 children 的情况，最复杂。
  })

})
