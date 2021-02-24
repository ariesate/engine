import { Graph, Addon, FunctionExt, Shape } from '@antv/x6'
import './flowShape'

///////////////////
export default function createFlowGraph(container, stencilContainer, onAddNode ) {
  const graph = new Graph({
    container,
    width: 1000,
    height: 800,
    grid: {
      size: 10,
      visible: true,
      type: 'mesh',
      args: [
        {
          color: '#cccccc',
          thickness: 1,
        },
        {
          color: '#5F95FF',
          thickness: 1,
          factor: 4,
        },
      ],
    },
    selecting: {
      enabled: true,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true,
    },
    connecting: {
      snap: true,
      allowBlank: true,
      allowLoop: true,
      highlight: true,
      anchor: 'center',
      connector: 'rounded',
      connectionPoint: 'boundary',
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
      },
      validateConnection({
                           sourceView,
                           targetView,
                           sourceMagnet,
                           targetMagnet,
                         }) {
        // 不允许自己连自己
        if (sourceView === targetView) {
          return false
        }
        // 不允许没有出口的
        if (!sourceMagnet) {
          return false
        }
        // 没有连上的
        if (!targetMagnet) {
          return false
        }
        return true
      },
    },
    highlighting: {
      magnetAvailable: {
        name: 'stroke',
        args: {
          padding: 4,
          attrs: {
            strokeWidth: 4,
            stroke: 'rgba(223,234,255)',
          },
        },
      },
    },
    snapline: true,
    history: true,
    clipboard: {
      enabled: true,
    },
    keyboard: {
      enabled: true,
    },
  })

  const stencil = initStencil(graph, stencilContainer, onAddNode)
  initShape(graph, stencil)
  initEvent(graph, container)
  return graph
}

function initStencil(graph, stencilContainer, onAddNode) {
  const stencil = new Addon.Stencil({
    target: graph,
    stencilGraphWidth: 280,
    search: { rect: true },
    collapsable: true,
    validateNode: viewNode => onAddNode(viewNode.position()),
    groups: [
      {
        name: 'basic',
        title: '基础节点',
        graphHeight: 180,
      },
      {
        name: 'combination',
        title: '组合节点',
        layoutOptions: {
          columns: 1,
          marginX: 60,
        },
        graphHeight: 260,
      },
      {
        name: 'group',
        title: '节点组',
        graphHeight: 100,
        layoutOptions: {
          columns: 1,
          marginX: 60,
        },
      },
    ],
  })
  stencilContainer.appendChild(stencil.container)
  return stencil
}

function initShape(graph, stencil) {
  const eventNode = graph.createNode({
    shape: 'event-node',
    attrs: {
      text: {
        text: '事件节点',
      },
    },
  })
  const responseNode = graph.createNode({
    shape: 'response-node',
    attrs: {
      text: {
        text: '响应节点',
      },
    },
  })

  const parallelStartNode = graph.createNode({
    shape: 'control-node',
    attrs: {
      text: {
        text: '并行开始节点',
      },
    },
  })

  const parallelEndNode = graph.createNode({
    shape: 'control-node',
    attrs: {
      text: {
        text: '并行结束节点',
      },
    },
  })

  const endNode = graph.createNode({
    shape: 'end-node',
    attrs: {
      text: {
        text: 'X',
      },
    },
  })


  const g1 = graph.createNode({
    shape: 'groupNode',
    attrs: {
      text: {
        text: 'Group Name',
      },
    },
    data: {
      parent: true,
    },
  })
  stencil.load([eventNode, responseNode, endNode], 'basic')
  stencil.load([parallelStartNode, parallelEndNode], 'combination')
  stencil.load([g1], 'group')
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
      console.log(rest)
      console.log(node.getBBox({ deep: true}))
      console.log(node.getBBox({ deep: true}))
      console.log(node)
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
