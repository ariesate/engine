/** @jsxFrag Fragment */
import { createElement, render } from '../index';
import StyleManager from '../StyleManager'

describe("style manager", () => {
  let styleManager
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    styleManager = new StyleManager()
  })

  test('basic selector', () => {
    const styleFn = (style) => {
      style.root ={
        color: 'blue'
      }
      style.root.child = {
        color: 'red'
      }
    }

    const scopeId = 'scope1'
    styleManager.digest(styleFn, scopeId)

    render(
      <root dataset={{scopeId}}>
        <child dataset={{scopeId}}/>
      </root>,
      document.body
    )

    // 通过 children 可以去掉 comment node
    const root = document.body.children[0]

    expect(root).toHaveStyle({ color : 'blue'})
    expect(root.childNodes[0]).toHaveStyle({ color : 'red'})
  })
})