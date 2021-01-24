/** @jsx createElement */
import {
  createElement,
  render,
  ref,
  Fragment,
  reactive,
  refComputed,
  delegateLeaf,
  propTypes,
} from '../index';
import $ from 'jquery'

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

})