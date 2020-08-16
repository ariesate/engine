const { propTypes, render, createElement } = require('../index')
const { ref, reactive, refComputed, objectComputed, arrayComputed, delegateLeaf } = require('../reactive/index.js')
import $ from 'jquery'

describe('component', () => {
  test('listener of propType callback', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => ref('john')),
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

  test('with user listener', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => ref('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    const userOnChange = (({ name }) => {
      name.value = `${name.value}2`
    })

    render(<App onChange={userOnChange}/>, root)

    // 默认值
    expect(root.children[0]).toHaveTextContent('john')

    $(root.children[0]).click()
    expect(root.children[0]).toHaveTextContent('john12')
  })

  test('user listener preventDefault', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => ref('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    const userOnChange = (() => {
      return false
    })

    render(<App onChange={userOnChange}/>, root)

    // 默认值
    expect(root.children[0]).toHaveTextContent('john')

    $(root.children[0]).click()
    expect(root.children[0]).toHaveTextContent('john')
  })

  test('user props', () => {
    function App({ name, onChange }) {
      return <div onClick={onChange}>{name}</div>
    }

    App.propTypes = {
      name: propTypes.string.default(() => ref('john')),
      onChange: propTypes.callback.default(() => ({ name }) => {
        name.value = `${name.value}1`
      })
    }

    const root = document.createElement('div')
    const userName = ref('tom')

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

})