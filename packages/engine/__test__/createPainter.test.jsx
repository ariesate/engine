/** @jsx createElement */
import createElement from '../createElement'
import createPainter from '../createPainter'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
  DEV_MAX_LOOP,
} from '../constant'
import { createRecursiveNormalize } from '../createElement'


/*************
 * paint
 *************/

describe('painter paint', () => {
  let painter
  let normalize = createRecursiveNormalize()
  const renderer = {
    rootRender(cnode) {
      return normalize(cnode.type.render())
    },
    initialRender(cnode) {
      return normalize(cnode.type.render())
    }
  }

  beforeEach(() => {
    painter = createPainter(renderer)
  })

  test('render Simple Component', () => {
    const App = {
      render() {
        return <div>app</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    expect(ctree.ret[0]).toMatchObject(normalize(<div>app</div>))
  })

  test('render with sub component', () => {
    const Sub = {
      render() {
        return (<div>sub</div>)
      }
    }

    const App = {
      render() {
        return (
          <div>
            <div>app</div>
            <Sub></Sub>
          </div>
        )
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    expect(ctree.ret[0]).toMatchObject(normalize(
      <div>
        <div>app</div>
        <Sub></Sub>
      </div>
    ))

    expect(Object.values(ctree.next).length).toBe(1)
    expect(Object.values(ctree.next)[0]).toMatchObject({
      level: 1,
      type: {
        render: Sub.render
      }
    })

  })
})

/******************
 * repaint basic
 ******************/

describe('painter repaint basic', () => {
  let painter
  let normalize = createRecursiveNormalize()
  const renderer = {
    rootRender(cnode) {
      return normalize(cnode.type.render())
    },
    initialRender(cnode) {
      return normalize(cnode.type.render())
    },
    updateRender(cnode) {
      return normalize(cnode.type.render())
    }
  }

  beforeEach(() => {
    painter = createPainter(renderer)
  })

  test('compare self', () => {
    let count = 0
    const App = {
      render() {
        return <div>{count}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    expect(ctree.ret[0]).toMatchObject(normalize(<div>0</div>))

    count++
    const diffResult = painter.repaint(ctree)
    expect(ctree.ret[0]).toMatchObject(normalize(<div>1</div>))
    expect(Object.keys(diffResult.toInitialize)).toHaveLength(0)
    expect(Object.keys(diffResult.toRemain)).toHaveLength(0)
    expect(Object.keys(diffResult.toDestroy)).toHaveLength(0)
    expect(Object.keys(diffResult.toDestroyPatch)).toHaveLength(0)

    const expectPatch = normalize(<div>1</div>)
    expectPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(expectPatch)
  })

})

/******************
 * repaint key diff
 ******************/

describe('repaint key diff', () => {

  let painter
  let normalize = createRecursiveNormalize()
  const renderer = {
    rootRender(cnode) {
      return normalize(cnode.type.render())
    },
    initialRender(cnode) {
      return normalize(cnode.type.render())
    },
    updateRender(cnode) {
      return normalize(cnode.type.render())
    }
  }

  beforeEach(() => {
    painter = createPainter(renderer)
  })

  test('insert key at end', () => {
    let count = 0
    const App = {
      render() {
        const arr = count === 0 ?
          [<span key={1}>1</span>] :
          [<span key={1}>1</span>, <span key={2}>2</span>]

        ++count
        return <div>{arr}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    const diffResult = painter.repaint(ctree)

    const arr = [<span>1</span>,<span>2</span>]
    expect(ctree.ret[0]).toMatchObject(normalize(<div>{arr}</div>))


    // 第一层
    const firstLayerPatch = <div></div>
    delete firstLayerPatch.children
    firstLayerPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(firstLayerPatch)

    // 第二层
    const firstKeySpan = normalize(<span>1</span>)
    firstKeySpan.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0].children[0].children[0]).toMatchObject(firstKeySpan)

    const secondKeySpan = normalize(<span>2</span>)
    secondKeySpan.action = { type: PATCH_ACTION_INSERT }
    expect(diffResult.patch[0].children[0].children.length).toBe(2)
    expect(diffResult.patch[0].children[0].children[1]).toMatchObject(secondKeySpan)
  })

  test('remove key at end', () => {
    let count = 0
    const App = {
      render() {
        const arr = count === 0 ?
          [<span key={1}>1</span>, <span key={2}>2</span>] :
          [<span key={1}>1</span>]


        ++count
        return <div>{arr}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    const diffResult = painter.repaint(ctree)

    const arr = [<span>1</span>]
    expect(ctree.ret[0]).toMatchObject(normalize(<div>{arr}</div>))

    // 第一层
    const firstLayerPatch = normalize(<div></div>)
    delete firstLayerPatch.children
    firstLayerPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(firstLayerPatch)

    // 第二层
    const firstKeySpan = normalize(<span>1</span>)
    firstKeySpan.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0].children[0].children[0]).toMatchObject(firstKeySpan)

    const secondKeySpan = {}
    secondKeySpan.action = { type: PATCH_ACTION_REMOVE }
    expect(diffResult.patch[0].children[0].children.length).toBe(2)
    expect(diffResult.patch[0].children[0].children[1]).toMatchObject(secondKeySpan)
  })

  test('insert key in middle', () => {
    let count = 0
    const App = {
      render() {
        const arr = count === 0 ?
          [<span key={1}>1</span>, <span key={3}>3</span>] :
          [<span key={1}>1</span>, <span key={2}>2</span>, <span key={3}>3</span>]

        ++count
        return <div>{arr}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    const diffResult = painter.repaint(ctree)

    // 第一层
    const firstLayerPatch = normalize(<div></div>)
    delete firstLayerPatch.children
    firstLayerPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(firstLayerPatch)

    // 第二层
    const firstKeySpan = normalize(<span>1</span>)
    firstKeySpan.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0].children[0].children[0]).toMatchObject(firstKeySpan)

    const secondKeySpan = normalize(<span>2</span>)
    secondKeySpan.action = { type: PATCH_ACTION_INSERT }
    expect(diffResult.patch[0].children[0].children[1]).toMatchObject(secondKeySpan)

    const thirdKeySpan = normalize(<span>3</span>)
    thirdKeySpan.action = { type: PATCH_ACTION_REMAIN}
    expect(diffResult.patch[0].children[0].children.length).toBe(3)
    expect(diffResult.patch[0].children[0].children[2]).toMatchObject(thirdKeySpan)
  })

  test('remove key in middle', () => {
    let count = 0
    const App = {
      render() {
        const arr = count === 0 ?
          [<span key={1}>1</span>, <span key={2}>2</span>, <span key={3}>3</span>] :
          [<span key={1}>1</span>, <span key={3}>3</span>]

        ++count
        return <div>{arr}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    const diffResult = painter.repaint(ctree)

    // 第一层
    const firstLayerPatch = normalize(<div></div>)
    delete firstLayerPatch.children
    firstLayerPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(firstLayerPatch)

    // 第二层
    const firstKeySpan = normalize(<span>1</span>)
    firstKeySpan.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0].children[0].children[0]).toMatchObject(firstKeySpan)

    const secondKeySpan = {}
    secondKeySpan.action = { type: PATCH_ACTION_REMOVE }
    expect(diffResult.patch[0].children[0].children[1]).toMatchObject(secondKeySpan)

    const thirdKeySpan = normalize(<span>3</span>)
    thirdKeySpan.action = { type: PATCH_ACTION_REMAIN}
    expect(diffResult.patch[0].children[0].children.length).toBe(3)
    expect(diffResult.patch[0].children[0].children[2]).toMatchObject(thirdKeySpan)
  })

  test('insert key at head', () => {
    let count = 0
    const App = {
      render() {
        const arr = count === 0 ?
          [<span key={2}>2</span>] :
          [<span key={1}>1</span>, <span key={2}>2</span>]

        ++count
        return <div>{arr}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    const diffResult = painter.repaint(ctree)

    // 第一层
    const firstLayerPatch = normalize(<div></div>)
    delete firstLayerPatch.children
    firstLayerPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(firstLayerPatch)

    // 第二层
    const firstKeySpan = normalize(<span>1</span>)
    firstKeySpan.action = { type: PATCH_ACTION_INSERT}
    expect(diffResult.patch[0].children[0].children[0]).toMatchObject(firstKeySpan)

    const secondKeySpan = normalize(<span>2</span>)
    secondKeySpan.action = { type: PATCH_ACTION_REMAIN}
    expect(diffResult.patch[0].children[0].children.length).toBe(2)
    expect(diffResult.patch[0].children[0].children[1]).toMatchObject(secondKeySpan)
  })

  test('remove key at head', () => {
    let count = 0
    const App = {
      render() {
        const arr = count === 0 ?
          [<span key={1}>1</span>, <span key={2}>2</span>] :
          [<span key={2}>2</span>]

        ++count
        return <div>{arr}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    const diffResult = painter.repaint(ctree)

    // 第一层
    const firstLayerPatch = normalize(<div></div>)
    delete firstLayerPatch.children
    firstLayerPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(firstLayerPatch)

    // 第二层
    const firstKeySpan = {}
    firstKeySpan.action = { type: PATCH_ACTION_REMOVE}
    expect(diffResult.patch[0].children[0].children[0]).toMatchObject(firstKeySpan)

    const secondKeySpan = normalize(<span>2</span>)
    secondKeySpan.action = { type: PATCH_ACTION_REMAIN}
    expect(diffResult.patch[0].children[0].children.length).toBe(2)
    expect(diffResult.patch[0].children[0].children[1]).toMatchObject(secondKeySpan)
  })

  test('replace one at head', () => {
    let count = 0
    const App = {
      render() {
        const arr = count === 0 ?
          [<span key={1}>1</span>] :
          [<span key={2}>2</span>]

        ++count
        return <div>{arr}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    const diffResult = painter.repaint(ctree)

    // 第一层
    const firstLayerPatch = normalize(<div></div>)
    delete firstLayerPatch.children
    firstLayerPatch.action = { type: PATCH_ACTION_REMAIN }
    expect(diffResult.patch[0]).toMatchObject(firstLayerPatch)

    // 第二层
    const firstKeySpan = normalize(<span>2</span>)
    firstKeySpan.action = { type: PATCH_ACTION_INSERT}
    expect(diffResult.patch[0].children[0].children.length).toBe(2)
    expect(diffResult.patch[0].children[0].children[0].action.type).toBe('patch.remove')
    expect(diffResult.patch[0].children[0].children[1].action.type).toBe('patch.insert')
    expect(diffResult.patch[0].children[0].children[1]).toMatchObject(firstKeySpan)
  })

  test('new ref', () => {
    let count = 0
    const ref1 = { current: null }
    const ref2 = { current: null }
    const App = {
      render() {

        const result = <div ref={count === 0 ? ref1 : ref2} />
        count++
        return result
      }
    }

    const ctree = painter.createCnode(<App/>)
    const paintResult = painter.paint(ctree)
    const firstNewRefsValues = Object.values(paintResult.newRefs)
    expect(firstNewRefsValues.length).toBe(1)
    expect(firstNewRefsValues[0].ref).toBe(ref1)

    const diffResult = painter.repaint(ctree)

    const newRefsValues = Object.values(diffResult.newRefs)
    expect(newRefsValues.length).toBe(1)
    expect(newRefsValues[0].ref).toBe(ref2)
  })

  test('remained ref', () => {
    let count = 0
    const ref1 = { current: null }
    const App = {
      render() {

        const result = <div ref={ref1} />
        count++
        return result
      }
    }

    const ctree = painter.createCnode(<App/>)
    const paintResult = painter.paint(ctree)
    const firstNewRefsValues = Object.values(paintResult.newRefs)
    expect(firstNewRefsValues.length).toBe(1)
    expect(firstNewRefsValues[0].ref).toBe(ref1)

    const diffResult = painter.repaint(ctree)

    const remainedRefs = Object.values(diffResult.remainedRefs)
    expect(remainedRefs.length).toBe(1)
    expect(remainedRefs[0].ref).toBe(ref1)
  })

  test('disposed ref', () => {
    let count = 0
    const ref1 = { current: null }
    const App = {
      render() {
        const result = <div ref={count === 0 ? ref1 : undefined} />
        count++
        return result
      }
    }

    const ctree = painter.createCnode(<App/>)
    const paintResult = painter.paint(ctree)
    const firstNewRefsValues = Object.values(paintResult.newRefs)
    expect(firstNewRefsValues.length).toBe(1)
    expect(firstNewRefsValues[0].ref).toBe(ref1)

    const diffResult = painter.repaint(ctree)

    const disposedRefs = Object.values(diffResult.disposedRefs)
    expect(disposedRefs.length).toBe(1)
    expect(Object.values(diffResult.remainedRefs).length).toBe(0)
    expect(Object.values(diffResult.newRefs).length).toBe(0)
    expect(disposedRefs[0].ref).toBe(ref1)
  })

  // test('diff with null vnode', () => {
  //   let isFirst = true
  //   const App = {
  //     render() {
  //       if (isFirst) {
  //         return [<span key={1}>1</span>, <span key={2}>2</span>, null]
  //       } else {
  //         return [<span key={1}>1</span>, null, <span key={2}>2</span>]
  //       }
  //     }
  //   }
  //
  //   const ctree = painter.createCnode(<App/>)
  //   painter.paint(ctree)
  //   isFirst = false
  //   const diffResult = painter.repaint(ctree)
  // })
})