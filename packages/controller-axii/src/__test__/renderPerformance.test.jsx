/** @jsx createElement */
import {
  createElement,
  render,
  reactive,
  delegateLeaf,
  propTypes,
  DIRTY
} from '../index';

const {  } = require('../reactive/index.js')

describe('basic render', () => {

  test('child should not render when callback change', () => {
    let childRendered = 0
    let selected

    const people = reactive([{
      id: 1,
      firstName: 'john',
      secondName: 'doe'
    }])

    function App() {
      return <div>
        {() => people.map(person => {
          return <Child key={person.id} name={delegateLeaf(person).firstName} onClick={() => selected = person}/>
        })}
      </div>
    }

    function Child({ name }) {
      childRendered += 1
      return <span>{name}</span>
    }

    Child.propTypes = {
      onClick: propTypes.callback.default(() => () => {}),
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(childRendered).toBe(1)
    expect(root.children[0]).partialMatchDOM(
      <div>
        <span>john</span>
      </div>
    )

    people.unshift({
      id: 2,
      firstName: 'tim',
      secondName: 'will'
    })
    // 这时第一个 Child 应该不渲染了。因为数据引用没变。回调引用虽然变了，但是我们会正确处理。
    expect(childRendered).toBe(2)
    expect(root.children[0]).partialMatchDOM(
      <div>
        <span>tim</span>
        <span>john</span>
      </div>
    )
  })

  test('child should not render when function prop change', () => {
    let childRendered = 0
    let selected

    const people = reactive([{
      id: 1,
      firstName: 'john',
      secondName: 'doe'
    }])

    function App() {
      return <div>
        {() => people.map(person => {
          return <Child key={person.id} person={person} renderChild={(p) => `a${p.firstName}`}/>
        })}
      </div>
    }

    function Child({ person, renderChild }) {
      childRendered += 1
      return <span>{() => renderChild(person)}</span>
    }

    Child.propTypes = {
      renderChild: propTypes.function.default(() => (p) => `${p.firstName}-${p.secondName}`),
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(childRendered).toBe(1)
    expect(root.children[0]).partialMatchDOM(
      <div>
        <span>ajohn</span>
      </div>
    )

    people[0].firstName = 'rod'
    expect(childRendered).toBe(1)
    expect(root.children[0]).partialMatchDOM(
      <div>
        <span>arod</span>
      </div>
    )

    people.unshift({
      id: 2,
      firstName: 'tim',
      secondName: 'will'
    })
    // 这时第一个 Child 应该不渲染了。因为数据引用没变。回调引用虽然变了，但是我们会正确处理。
    expect(childRendered).toBe(2)
    expect(root.children[0]).partialMatchDOM(
      <div>
        <span>atim</span>
        <span>arod</span>
      </div>
    )
  })

  test('child should render when function prop mark as DIRTY', () => {
    let childRendered = 0
    let selected

    const people = reactive([{
      id: 1,
      firstName: 'john',
      secondName: 'doe'
    }])

    function App() {
      return <div>
        {() => people.map(person => {
          return <Child key={person.id} person={person} renderChild={DIRTY((p) => `a${p.firstName}`)}/>
        })}
      </div>
    }

    function Child({ person, renderChild }) {
      childRendered += 1
      return <span>{() => renderChild(person)}</span>
    }

    Child.propTypes = {
      renderChild: propTypes.function.default(() => (p) => `${p.firstName}-${p.secondName}`),
    }

    const root = document.createElement('div')
    render(<App />, root)

    expect(childRendered).toBe(1)
    expect(root.children[0]).partialMatchDOM(
      <div>
        <span>ajohn</span>
      </div>
    )

    people.unshift({
      id: 2,
      firstName: 'tim',
      secondName: 'will'
    })

    expect(childRendered).toBe(3)
    expect(root.children[0]).partialMatchDOM(
      <div>
        <span>atim</span>
        <span>ajohn</span>
      </div>
    )
  })

})