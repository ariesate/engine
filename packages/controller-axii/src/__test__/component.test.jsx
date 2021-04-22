const { propTypes, render, createElement } = require('../index')
const { atom } = require('../reactive/index.js')
import $ from 'jquery'

describe('component', () => {
  test('listener of callback propType ', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => atom('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    render(<App />, root)

    // 默认值
    expect(root.children[0]).toHaveTextContent('john')

    $(root.children[0]).click()
    expect(root.children[0]).toHaveTextContent('john1')
  })

  test('user listener should work', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => atom('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    // 补足的第二个参数是个数组，数组中是 [draftProps, props]
    const userOnChange = ({ name }) => {
      name.value = `${name.value}2`
    }

    render(<App onChange={userOnChange}/>, root)

    // 默认值
    expect(root.children[0]).toHaveTextContent('john')

    $(root.children[0]).click()
    expect(root.children[0]).toHaveTextContent('john12')
  })

  test('user listener can preventDefault', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => atom('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    const userOnChange = () => {
      return false
    }

    render(<App onChange={userOnChange}/>, root)

    // 默认值
    expect(root.children[0]).toHaveTextContent('john')

    $(root.children[0]).click()
    expect(root.children[0]).toHaveTextContent('john')
  })

  test('pass reactive props to component', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => atom('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    const userName = atom('tom')

    render(<App name={userName}/>, root)

    // 默认值
    expect(root.children[0]).toHaveTextContent('tom')

    $(root.children[0]).click()
    expect(root.children[0]).toHaveTextContent('tom1')
    expect(userName.value).toBe('tom1')

    // again
    $(root.children[0]).click()
    expect(userName.value).toBe('tom11')
    expect(root.children[0]).toHaveTextContent('tom11')

  })

  test('pass non-reactive props to component', () => {

    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => atom('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    const userName = 'tom'

    render(<App name={userName}/>, root)

    // 默认值
    expect(root.children[0]).toHaveTextContent('tom')

    $(root.children[0]).click()
    expect(root.children[0]).toHaveTextContent('tom')
  })

})

