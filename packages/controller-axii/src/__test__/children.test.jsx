/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement, Fragment, vnodeComputed, propTypes } from '../index';
import { createFlatChildrenProxy, createChildrenProxy } from '../controller/createChildrenProxy';
const { reactive } = require('../reactive/index.js')
import {recursiveNormalize} from '../createElement'

describe('children proxy', () => {

  test('should get right child by index', () => {
    const base = reactive([1,2])

    const { children } = recursiveNormalize(<>
      <div>child</div>
      {vnodeComputed(() => {
        return base.map(num => <div>child{num}</div>)
      })}
    </>)

    const flatChildren = createFlatChildrenProxy(children)

    // expect(flatChildren[0]).toMatchObject(recursiveNormalize(<div>child</div>))
    // CAUTION 注意这里 match 中的数字要括号，因为上面的child 和变量数字其实是生成两个节点，这里也要对应。
    expect(flatChildren[1]).toMatchObject(<div>child{1}</div>)
    expect(flatChildren[2]).toMatchObject(<div>child{2}</div>)
  })

  test('deep flatten children', () => {
    const base = reactive([1,2])

    const { children } = (<>
      <div>child</div>
      {vnodeComputed(() => {
        return base.map(num => [<div>child{num}</div>, <div>child{num+1}</div>])
      })}
    </>)

    const flatChildren = createFlatChildrenProxy(children)

    expect(flatChildren[0]).toMatchObject(<div>child</div>)
    expect(flatChildren[1]).toMatchObject(<div>child{1}</div>)
    expect(flatChildren[2]).toMatchObject(<div>child{2}</div>)
    expect(flatChildren[3]).toMatchObject(<div>child{2}</div>)
    expect(flatChildren[4]).toMatchObject(<div>child{3}</div>)
  })


  test('should be reactive', () => {
    const base = reactive([1,2])

    const { children } = (<>
      <div>child</div>
      {vnodeComputed(() => {
        return base.map(num => <div>child{num}</div>)
      })}
    </>)

    const flatChildren = createFlatChildrenProxy(children)

    let nonReactiveRendered = 0
    const firstChildWrapper = vnodeComputed(() => {
      nonReactiveRendered += 1
      return <div>{flatChildren[0]}</div>
    })

    let reactiveRendered = 0
    const secondChildWrapper = vnodeComputed(() => {
      reactiveRendered += 1
      return <div>{flatChildren[1]}</div>
    })

    expect(nonReactiveRendered).toBe(1)
    expect(firstChildWrapper.value).toMatchObject(<div><div>child</div></div>)

    expect(reactiveRendered).toBe(1)
    expect(secondChildWrapper.value).toMatchObject(<div><div>child{1}</div></div>)

    // reactive
    base.unshift(0)
    // 如果没触碰到 vnodeComputed 就不应该响应
    expect(nonReactiveRendered).toBe(1)
    expect(firstChildWrapper.value).toMatchObject(<div><div>child</div></div>)

    expect(reactiveRendered).toBe(2)
    expect(secondChildWrapper.value.children[0].children).toMatchObject(['child', 0])
  })


  test('arrayOf(element) type children should have right isChildren mark', () => {
    const { children: children1 } = (<>
      <div>child</div>
    </>)
    const markedChildren1 = createChildrenProxy(children1, propTypes.arrayOf(propTypes.element()))
    expect(markedChildren1.isChildren).toBe(true)
    expect(markedChildren1[0].isChildren).toBe(true)
  })

  test('element type and vnodeComputed element children should have right isChildren mark', () => {
    const children = <div></div>
    const markedChildren = createChildrenProxy(children, propTypes.element())
    expect(markedChildren.isChildren).toBe(true)

    const children2 = vnodeComputed(() => <div></div>)
    const markedChildren2 = createChildrenProxy(children2, propTypes.element())
    expect(markedChildren2.isChildren).toBe(true)
  })

  test('vnodeComputed element children with children should have right isChildren mark', () => {
    const children2 = () => <div><span></span></div>
    const markedChildren2 = createChildrenProxy(children2, propTypes.element())
    debugger
    expect(markedChildren2.children.length).toBe(1)
    expect(markedChildren2.children[0].isChildren).toBe(true)
    expect(markedChildren2.children[0]).toMatchObject(<span></span>)
  })

  test('shapeOf [element] children should have right isChildren mark', () => {
    const children2 = [<div></div>]
    const markedChildren2 = createChildrenProxy(children2, propTypes.shapeOf([propTypes.element()]))
    expect(markedChildren2.isChildren).toBe(true)
    expect(markedChildren2[0].isChildren).toBe(true)
  })

  test('shapeOf {} children should have right isChildren mark', () => {
    const children2 = {
      header: <div></div>,
      content: <div></div>,
      body: {
        top: <div></div>,
        bottom: <div></div>,
      }
    }
    const markedChildren2 = createChildrenProxy(children2, propTypes.shapeOf({
      header: propTypes.element(),
      content: propTypes.element(),
      body: {
        top: propTypes.element(),
        bottom: propTypes.element()
      }
    }))
    expect(markedChildren2.isChildren).toBe(true)
    debugger
    expect(markedChildren2.header.isChildren).toBe(true)
    expect(markedChildren2.content.isChildren).toBe(true)
    expect(markedChildren2.body.top.isChildren).toBe(true)
    expect(markedChildren2.body.bottom.isChildren).toBe(true)
  })

  test('shapeOf {} vnodeComputed children should have right isChildren mark', () => {
    const children2 = () => ({
      header: <div></div>,
      content: <div></div>,
      body: {
        top: <div></div>,
        bottom: <div></div>,
      }
    })

    const markedChildren2 = createChildrenProxy(children2, propTypes.shapeOf({
      header: propTypes.element(),
      content: propTypes.element(),
      body: {
        top: propTypes.element(),
        bottom: propTypes.element()
      }
    }))
    expect(markedChildren2.isChildren).toBe(true)
    expect(markedChildren2.header.isChildren).toBe(true)
    expect(markedChildren2.content.isChildren).toBe(true)
    expect(markedChildren2.body.top.isChildren).toBe(true)
    expect(markedChildren2.body.bottom.isChildren).toBe(true)
  })

  test('shapeOf {} with partial vnodeComputed children should have right isChildren mark', () => {
    const children2 = {
      header: () => <div></div>,
      content: () => [<div></div>, <div></div>],
    }
    const markedChildren2 = createChildrenProxy(children2, propTypes.shapeOf({
      header: propTypes.element(),
      content: propTypes.arrayOf(propTypes.element()),
    }))
    expect(markedChildren2.isChildren).toBe(true)
    expect(markedChildren2.header.isChildren).toBe(true)
    expect(markedChildren2.content.isChildren).toBe(true)
    expect(markedChildren2.content[0].isChildren).toBe(true)
    expect(markedChildren2.content[1].isChildren).toBe(true)
    expect(markedChildren2.content[2]).toBe(undefined)
  })

  test('proxy children should render right', () => {
    const children = () => [<div>1</div>, <div>2</div>]
    const markedChildren = createChildrenProxy(children)
    expect(markedChildren.isChildren).toBe(true)
    expect(markedChildren.length).toBe(2)
    expect(markedChildren[0].isChildren).toBe(true)
    expect(markedChildren[1].isChildren).toBe(true)
    expect(markedChildren[0]).toMatchObject(<div>1</div>)
    expect(markedChildren[1]).toMatchObject(<div>2</div>)
  })

})

