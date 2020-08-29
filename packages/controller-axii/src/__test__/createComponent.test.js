/** @jsxFrag Fragment */
import { createElement, render, ref } from '../index';
import createComponent from '../component/createComponent'
import $ from 'jquery'

describe('Style test', () => {
  test('static style', () => {

    function Base() {
      return <container />
    }

    Base.Style = (fragments) => {
      fragments.root.elements.container.style = {
        color: 'red'
      }
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    render(<BaseComponent />, root)

    expect(root.children[0]).toHaveStyle({ color: 'red'})
  })

  test('dynamic style', () => {

    const base = ref(1)

    function Base() {
      return <container />
    }

    Base.Style = (fragments) => {
      fragments.root.elements.container.style = () => ({
        color: base.value === 1 ? 'red' : 'blue'
      })
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    render(<BaseComponent />, root)
    expect(root.children[0]).toHaveStyle({ color: 'red'})

    base.value = 2
    expect(root.children[0]).toHaveStyle({ color: 'blue'})
  })
})



describe('create component', () => {

  test('method invoke callbacks', () => {
    let callbackCalled = false
    function Base({ change }) {
      return <container onClick={change}/>
    }

    Base.methods = {
      change() {
      }
    }

    const props = {
      onChange() {
        callbackCalled = true
      }
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    render(<BaseComponent {...props}/>, root)

    $(root.children[0]).click()
    expect(callbackCalled).toBe(true)
  })

  test('transparent listener', () => {

  })

  test('slot children', () => {

  })

  test('partial rewrite', () => {

  })
})



describe('Feature based', () => {
  test('pass right local vars to method/mutation/Style', () => {

  })

  test('use mutations', () => {

  })
})