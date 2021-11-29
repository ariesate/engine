import { createElement,render } from 'axii';
import { Graph, Addon, FunctionExt, Shape, NodeView } from '@antv/x6'

class SimpleNodeView extends NodeView {
  renderMarkup() {
    return this.renderJSONMarkup({
      tagName: 'rect',
      selector: 'body',
    })
  }

  update() {
    super.update({
      body: {
        refWidth: '100%',
        refHeight: '100%',
        fill: '#31d0c6',
      },
    })
  }
}
///////////////////
export function createFlowGraph(container, initOptions = {}) {
  const {connectingValidate = {}, width = 1000, height = 800, onPortRendered} = initOptions;

  const graph = new Graph({
    container,
    width,
    height,
    grid: true,
    panning: true,
    // scroller: true,
    minimap: initOptions.minimap ? {
      enabled: true,
      container: initOptions.minimap,
      width: 400,
      height: 200,
      graphOptions: {
        async: true,
        getCellView(cell) {
          if (cell.isNode()) {
            return SimpleNodeView
          }
        },
        createCellView(cell) {
          if (cell.isEdge()) {
            return null
          }
        },
      },
    } : undefined,
    onPortRendered: onPortRendered,
    // selecting: {
    //   enabled: true,
    //   multiple: true,
    //   rubberband: true,
    //   movable: true,
    //   showNodeSelectionBox: true,
    // },
    connecting: {
    //   snap: true,
    //   allowBlank: true,
    //   allowLoop: true,
    //   highlight: true,
    //   anchor: 'center',
    //   connector: 'rounded',
    //   connectionPoint: 'boundary',
    //   ...connectingValidate,
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#5F95FF',
              strokeWidth: 1,
              targetMarker: {
                name: 'classic',
                size: 8,
              },
            },
          },
          router: {
            name: 'manhattan',
          },
        })
      }
    },
    // highlighting: {
    //   magnetAvailable: {
    //     name: 'stroke',
    //     args: {
    //       padding: 4,
    //       attrs: {
    //         strokeWidth: 4,
    //         stroke: 'rgba(223,234,255)',
    //       },
    //     },
    //   },
    // },
    // snapline: true,
    // history: true,
    // clipboard: {
    //   enabled: true,
    // },
    // keyboard: {
    //   enabled: true,
    //   global: false
    // },
  })

  initEvent(graph, container)
  return graph
}

function initEvent(graph, container) {
  graph.bindKey('backspace', () => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      graph.removeCells(cells)
    }
  })

  // 监听 node 的文字大小改变
  graph.on('node:change:attrs', ({ options , node, ...rest}) => {
    if (options.propertyPath === 'attrs/text/text') {
      // 重新调整
      // console.log(rest)
      // console.log(node.getBBox({ deep: true}))
      // console.log(node.getBBox({ deep: true}))
      // console.log(node)
      node.fit()

      // TODO 按中心变大
      const textElement = graph.findViewByCell(rest.cell).findOne('text')
      const { width: textWidth } = textElement.getBoundingClientRect()
      const { height: originHeight, width: originWidth } = node.size()
      const { x, y } = node.position()
      const nextWidth = Math.ceil(textWidth) + 20

      node.size(nextWidth, originHeight)
      // 默认往右下移动，所以往左调回来一点。
      // TODO 未来应该 y 也要调整。
      node.position(x-(nextWidth - originWidth)/2, y)
    }
  })

  // TODO 增加了这个才能把之前没连上的线连上
  graph.on('edge:mouseenter', ({ edge }) => {
    edge.addTools([
      'target-arrowhead',
    ])
  })

  graph.on('edge:mouseleave', ({ edge }) => {
    edge.removeTools()
  })
}
