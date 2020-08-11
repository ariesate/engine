const { default: createPainter }= require('../createPainter')
const createElement = require('../createElement').default
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
  const renderer = {
    rootRender(cnode) {
      return cnode.type.render()
    },
    initialRender(cnode) {
      return cnode.type.render()
    },
    updateRender(cnode) {
      return cnode.type.render()
    }
  }

  beforeEach(() => {
    painter = createPainter(renderer)
    rootElement = document.createElement('div')
    view = createDOMView({ invoke: () => {} }, rootElement)
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

    const refs = ctree.view.getViewRefs()
    expect(refs[0].outerHTML).toBe('<div><span>span0</span><div>div1</div></div>')

    painter.repaint(ctree)
    view.updateDigest(ctree)

    expect(refs[0].outerHTML).toBe('<div><span>span1</span><div>div1</div></div>')
  })
})