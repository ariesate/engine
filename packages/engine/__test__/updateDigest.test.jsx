import {createRecursiveNormalize} from "../createElement";

/** @jsx createElement */
const createElement = require('../createElement').default
const { default: createPainter }= require('../createPainter')
const createDOMView = require('../DOMView/createDOMView').default

const {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
  DEV_MAX_LOOP,
} = require('../constant')

describe('array', () => {
  let painter
  let view
  let rootElement
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
    rootElement = document.createElement('div')
    view = createDOMView({ invoke: () => {} }, rootElement)
  })

  test('replace item', () => {
    let count = 0
    const App = {
      render() {
        const array = count === 0 ?
          [<span key={1}>1</span>, <span key={3}>3</span>] :
          [<span key={2}>2</span>, <span key={3}>3</span>]
        ++count
        return <div>{array}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    view.initialDigest(ctree)

    const refs = ctree.view.getRootElements()
    expect(refs[0].outerHTML).toBe('<div><span>1</span><span>3</span></div>')

    painter.repaint(ctree)
    view.updateDigest(ctree)

    expect(refs[0].outerHTML).toBe('<div><span>2</span><span>3</span></div>')
  })

  test('consecutive arrays', () => {
    let count = 0
    const App = {
      render() {
        const array1 = [<span key={`span${count}`}>{`span${count}`}</span>]
        const array2 = [<div key="div1">div1</div>]

        ++count
        return <div>{array1}{array2}</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    view.initialDigest(ctree)

    const refs = ctree.view.getRootElements()
    expect(refs[0].outerHTML).toBe('<div><span>span0</span><div>div1</div></div>')

    painter.repaint(ctree)
    view.updateDigest(ctree)

    expect(refs[0].outerHTML).toBe('<div><span>span1</span><div>div1</div></div>')
  })

  test('remove at end',() => {
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
    view.initialDigest(ctree)

    const refs = ctree.view.getRootElements()
    expect(refs[0].outerHTML).toBe('<div><span>1</span><span>2</span></div>')

    painter.repaint(ctree)
    view.updateDigest(ctree)

    expect(refs[0].outerHTML).toBe('<div><span>1</span></div>')
  })

  test('remove at end after second digestion',() => {
    let count = 0
    const App = {
      render() {
        ++count
        if (count === 1) {
          return <div></div>
        } else if (count === 2) {
          return <div>{[<span key={1}>1</span>, <span key={2}>2</span>]}</div>
        } else {
          return <div>{[<span key={1}>1</span>]}</div>
        }
      }
    }


    const ctree = painter.createCnode(<App />)
    painter.paint(ctree)
    view.initialDigest(ctree)

    const refs = ctree.view.getRootElements()
    expect(refs.length).toBe(1)

    painter.repaint(ctree)
    view.updateDigest(ctree)
    expect(refs[0].outerHTML).toBe('<div><span>1</span><span>2</span></div>')

    painter.repaint(ctree)
    view.updateDigest(ctree)
    expect(refs[0].outerHTML).toBe('<div><span>1</span></div>')
  })
})

// TODO fragment/array 的测试补全，包括placeholder