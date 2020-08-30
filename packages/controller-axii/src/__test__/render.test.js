/** @jsx createElement */
import { vnodeComputed, createElement, Fragment } from '../index';
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

    expect(root.children[0]).partialMatch(<div style={{color: 'red'}}/>)
    expect(rendered).toBe(1)

    base.value = 2
    expect(root.children[0]).partialMatch(<div style={{color: 'blue'}}/>)
    // // 不需要再渲染
    // expect(rendered).toBe(1)

  })

  test('reactive vnode(vnodeComputed)', () => {
    // TODO 没有使用 vnodeComputed 包裹的动态节点，可能会收集到错误的 cnode。
    const list = reactive([1, 2])
    let rendered = 0

    function App() {
      rendered += 1
      return <div>{ vnodeComputed(() => {
        return list.map((num, index) => {
          return <span key={num}>{num}</span>
        })
      })}</div>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(root.children[0].children.length).toBe(list.length)
    expect(rendered).toBe(1)

    list.push(3)

    expect(root.children[0]).partialMatch(
      <div>
        <span key={1}>1</span>
        <span key={2}>2</span>
        <span key={3}>3</span>
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
    expect(root.children[0]).partialMatch(
      <div>
        <span>john</span>
        <span>-</span>
        <span>doe</span>
      </div>
    )

    person.firstName = 'tim'
    expect(rendered).toBe(1)
    expect(childRendered).toBe(2)
    expect(root.children[0]).partialMatch(
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
    expect(root.children[0]).partialMatch(
      <div>
        <span>reset</span>
        <span>-</span>
        <span>reset</span>
      </div>
    )
    expect(person.firstName).toBe('reset')
    expect(person.secondName).toBe('reset')
  })

  // test('children proxy', () => {
    // 读取了 children 的情况，最复杂。
  // })
})

describe('complex vnodeComputed', () => {

  // TODO vnodeComputed 返回 fragment 之后，就不更新视图了！！！！
  test('single vnodeComputed', () => {
    const base = ref(1)
    let rendered = 0
    let computedCalled = 0
    function App() {
      rendered +=1
      return <div>
        {vnodeComputed(() => {
          computedCalled += 1
          return (
            <>
              {base.value === 1 ? <span>1</span> : <div>2</div>}
            </>
          )
        })}
      </div>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(rendered).toBe(1)
    expect(computedCalled).toBe(1)
    expect(root.children[0]).partialMatch(
      <div>
        <span>1</span>
      </div>
    )

    base.value = 2
    expect(rendered).toBe(1)
    expect(computedCalled).toBe(2)
    expect(root.children[0]).partialMatch(
      <div>
        <div>2</div>
      </div>
    )
  })

  test('vnodeComputed should not prevent inner component remain', () => {

    let childRendered = 0
    function Child() {
      childRendered += 1
      return <div>child</div>
    }

    const base = ref(1)
    let rendered = 0
    function App() {
      rendered +=1
      return <div>
        {vnodeComputed(() => {
          return (
            <div>
              <Child />
              {base.value === 1? <span>1</span> : <div>2</div>}
            </div>
          )
        })}
      </div>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(rendered).toBe(1)
    expect(childRendered).toBe(1)
    expect(root.children[0]).partialMatch(
      <div>
        <div>
          <div>child</div>
          <span>1</span>
        </div>
      </div>
    )

    base.value = 2
    expect(rendered).toBe(1)
    expect(childRendered).toBe(1)
    expect(root.children[0]).partialMatch(
      <div>
        <div>
          <div>child</div>
          <div>2</div>
        </div>
      </div>
    )
  })

  test('side effect computed should be destroyed', () => {
    const base = ref(1)
    let rendered = 0
    let innerComputedCalled = 0
    function App() {
      rendered +=1
      return <div>
        {vnodeComputed(() => {
          const innerComputed = refComputed(() => {
            innerComputedCalled += 1
            return base.value + 1
          })
          return <span>{innerComputed}</span>
        })}
      </div>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(rendered).toBe(1)
    expect(innerComputedCalled).toBe(1)
    expect(root.children[0]).partialMatch(
      <div>
        <span>2</span>
      </div>
    )

    base.value = 2
    expect(rendered).toBe(1)
    expect(innerComputedCalled).toBe(2)
    expect(root.children[0]).partialMatch(
      <div>
        <span>3</span>
      </div>
    )

    base.value = 3
    expect(rendered).toBe(1)
    expect(innerComputedCalled).toBe(3)
    expect(root.children[0]).partialMatch(
      <div>
        <span>4</span>
      </div>
    )
  })

  test('reactive props inside vnodeComputed', () => {

    const base1 = ref(1)
    const base2 = ref(1)
    let computedCalled = 0

    function App() {
      return <div>
        {vnodeComputed(() => {
          computedCalled += 1
          if (base1.value > 10) return null

          const style = refComputed(() => {
            return {
              color: base2.value === 1 ? 'red' : 'blue'
            }
          })
          return <div style={style} />
        })}
      </div>
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(root.children[0]).partialMatch(<div><div style={{color: 'red'}}/></div>)
    expect(computedCalled).toBe(1)
    // 第一次外层不变化时，内层应该响应
    base2.value = 2
    expect(root.children[0]).partialMatch(<div><div style={{color: 'blue'}}/></div>)
    expect(computedCalled).toBe(1)

    base1.value = 2
    expect(root.children[0]).partialMatch(<div><div style={{color: 'blue'}}/></div>)
    expect(computedCalled).toBe(2)

    // 外层变化后，内层也还是应该能响应变化
    base2.value = 1
    expect(root.children[0]).partialMatch(<div><div style={{color: 'red'}}/></div>)
    expect(computedCalled).toBe(2)

    // 即使外层变成一次null
    base1.value = 11
    expect(root.children[0]).partialMatch(<div></div>)
    expect(computedCalled).toBe(3)

    // 又变回来
    base1.value = 3
    expect(root.children[0]).partialMatch(<div><div style={{color: 'red'}}/></div>)
    expect(computedCalled).toBe(4)

    base2.value = 2
    expect(root.children[0]).partialMatch(<div><div style={{color: 'blue'}}/></div>)
    expect(computedCalled).toBe(4)
  })

})

