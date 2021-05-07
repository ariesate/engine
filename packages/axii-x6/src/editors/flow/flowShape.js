import { Graph, Dom, Node } from '@antv/x6'
import { merge } from 'lodash-es'

const baseRectConfig = {
  inherit: 'rect',
  width: 80,
  height: 42,
  attrs: {
    body: {
      stroke: '#5F95FF',
      strokeWidth: 1,
      fill: 'rgba(95,149,255,0.05)',
      refWidth: '100%',
      refHeight: '100%',
    },
    fo: {
      refWidth: '100%',
      refHeight: '100%',
    },
    foBody: {
      xmlns: Dom.ns.xhtml,
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },
    'edit-text': {
      contenteditable: 'true',
      class: 'x6-edit-text',
      style: {
        width: '100%',
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(0,0,0,0.85)',
      },
    },
    text: {
      fontSize: 12,
      fill: 'rgba(0,0,0,0.85)',
    },
  },
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'text',
      selector: 'text',
    },
    {
      tagName: 'foreignObject',
      selector: 'fo',
      children: [
        {
          ns: Dom.ns.xhtml,
          tagName: 'body',
          selector: 'foBody',
          children: [
            {
              tagName: 'div',
              selector: 'edit-text',
            },
          ],
        },
      ],
    },
  ],
  ports: {
    groups: {
      in: {
        position: 'top',
        attrs: {
          circle: {
            r: 3,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
          },
        },
      },
      out: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 3,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
          },
        },
      },
    },
    items: [],
  },
}


export const EventNode = Graph.registerNode('event-node', merge({}, baseRectConfig, {
  attrs: {
    body: {
      rx: 10,
      ry: 24,
    },
  },
}))

export const ResponseNode = Graph.registerNode('response-node', merge({}, baseRectConfig, {
  attrs: {
    body: {
      fill: '#ffffff',
    },
  },
}))

export const ControlNode = Graph.registerNode('control-node', merge({}, baseRectConfig, {
  attrs: {
    body: {
      fill: '#333333',
      strokeWidth: 0,
    },
    text: {
      fill: '#ffffff',
    },
  },
}))

export const EndNode = Graph.registerNode('end-node', merge({}, baseRectConfig, {
  width: 70,
  height: 70,
  attrs: {
    body: {
      rx: 35,
      ry: 35,
      fill: '#333333',
      strokeWidth: 0,
    },
    text: {
      fill: '#ffffff',
    },
  },
}))

export const BasicEdge = Graph.registerEdge('basic-edge', {
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

export const ReuseNode = Graph.registerNode('reuse-node', baseRectConfig)

export class NodeGroup extends Node {
  constructor() {
    super();
    this.collapsed = true
  }

  postprocess() {
    this.toggleCollapse(true)
  }

  isCollapsed() {
    return this.collapsed
  }

  toggleCollapse(collapsed) {
    const target = collapsed == null ? !this.collapsed : collapsed
    if (target) {
      this.attr('buttonSign', { d: 'M 1 5 9 5 M 5 1 5 9' })
      this.resize(200, 40)
    } else {
      this.attr('buttonSign', { d: 'M 2 5 8 5' })
      this.resize(240, 240)
    }
    this.collapsed = target
  }
}

NodeGroup.config({
  shape: 'rect',
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'image',
      selector: 'image',
    },
    {
      tagName: 'text',
      selector: 'text',
    },
    {
      tagName: 'g',
      selector: 'buttonGroup',
      children: [
        {
          tagName: 'rect',
          selector: 'button',
          attrs: {
            'pointer-events': 'visiblePainted',
          },
        },
        {
          tagName: 'path',
          selector: 'buttonSign',
          attrs: {
            fill: 'none',
            'pointer-events': 'none',
          },
        },
      ],
    },
  ],
  attrs: {
    body: {
      refWidth: '100%',
      refHeight: '100%',
      strokeWidth: 1,
      fill: 'rgba(95,149,255,0.05)',
      stroke: '#5F95FF',
    },
    image: {
      'xlink:href':
        'https://gw.alipayobjects.com/mdn/rms_0b51a4/afts/img/A*X4e0TrDsEiIAAAAAAAAAAAAAARQnAQ',
      width: 16,
      height: 16,
      x: 8,
      y: 12,
    },
    text: {
      fontSize: 12,
      fill: 'rgba(0,0,0,0.85)',
      refX: 30,
      refY: 15,
    },
    buttonGroup: {
      refX: '100%',
      refX2: -25,
      refY: 13,
    },
    button: {
      height: 14,
      width: 16,
      rx: 2,
      ry: 2,
      fill: '#f5f5f5',
      stroke: '#ccc',
      cursor: 'pointer',
      event: 'node:collapse',
    },
    buttonSign: {
      refX: 3,
      refY: 2,
      stroke: '#808080',
    },
  },
})

Graph.registerNode('groupNode', NodeGroup)

// 注册默认边

