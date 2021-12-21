
import createElement from '../createElement'
import createPainter from '../createPainter'
import createDOMView from '../DOMView/createDOMView'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
  PATCH_ACTION_REMOVE,
  PATCH_ACTION_TO_MOVE,
  DEV_MAX_LOOP,
} from '../constant'

describe('initialDigest', () => {
  let painter
  let view
  let rootElement
  const renderer = {
    rootRender(cnode) {
      return cnode.type.render()
    },
    initialRender(cnode) {
      return cnode.type.render()
    }
  }

  beforeEach(() => {
    painter = createPainter(renderer)
    rootElement = document.createElement('div')
    view = createDOMView({ invoke: () => {} }, rootElement)
  })

  test('initialDigest', () => {
    const App = {
      render() {
        return <div>app</div>
      }
    }

    const ctree = painter.createCnode(<App/>)
    painter.paint(ctree)
    view.initialDigest(ctree)

    const refs = ctree.view.getRootElements()
    expect(refs[0].outerHTML).toBe('<div>app</div>')
  })
})

// TODO 补全更细致的包括 placeholder 的特使用力
// 数组/fragment