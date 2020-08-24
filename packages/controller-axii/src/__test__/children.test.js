/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement, Fragment, vnodeComputed } from '../index';
import createFlatChildrenProxy from '../createFlatChildrenProxy';
const { ref, reactive, refComputed, objectComputed, arrayComputed } = require('../reactive/index.js')

describe('children proxy', () => {

  test('should get right child by index', () => {
    const base = reactive([1,2])

    const { children } = (<>
      <div>child</div>
      {vnodeComputed(() => {
        return base.map(num => <div>child{num}</div>)
      })}
    </>)

    const flatChildren = createFlatChildrenProxy(children)

    expect(flatChildren[0]).toMatchObject(<div>child</div>)
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


  test('should reactive', () => {
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
    // 如果没吃碰到 vnodeComputed 就不应该响应
    expect(nonReactiveRendered).toBe(1)
    expect(firstChildWrapper.value).toMatchObject(<div><div>child</div></div>)

    expect(reactiveRendered).toBe(2)
    expect(secondChildWrapper.value).toMatchObject(<div><div>child{0}</div></div>)
  })

})

