/** @jsx createElement */
import { createFlowGraph } from './graph';
import { Graph as X6Graph, Markup } from '@antv/x6'
import lodash from 'lodash';
import { createElement, render, useRef } from "axii";
import { DEFAULT_SHAPE } from '../../Node';

export const Register = {
  htmlComponentMap: new Map(),
  registerHTMLComponent(name, func) {
    if (!this.htmlComponentMap.get(name)) {
      this.htmlComponentMap.set(name, func);
      X6Graph.registerHTMLComponent(name, func);
    }
  },
  registerHTMLComponentRender({ graph, dm, myNode, myPort, myEdge }) {
    return (node) => {
      const wrap = document.createElement('div')
      const nodeConfig = dm.findNode(node.id);
      
      const Cpt = myNode.getComponent(nodeConfig);
      
      render(<Cpt {...nodeConfig} data={myNode.data} />, wrap);

      setTimeout(() => {
        const { width, height } = (wrap.children[0].getBoundingClientRect());
        node.setProp({ width, height });
        myNode.setSize({ width, height });      

        // render port
        const portConfig = myPort.getPortConfig(nodeConfig);
        const ports = {
          groups: new Array(portConfig.ids.length).fill('p').map((idPre, index) => {
            const position = portConfig.positions[index];
            return {
              [`${idPre}${index}`]: {
                position: [position.x, position.y],
                attrs: {
                  fo: {
                    width: portConfig.size[0],
                    height: portConfig.size[1],
                    magnet: true,
                  }
                }
              }
            };
          }).reduce((p, n) => Object.assign(p, n), {}),
          items: new Array(portConfig.ids.length).fill('p').map((idPre, index) => {
            return {
              id: portConfig.ids ? portConfig.ids[index] : `${idPre}${index}`,
              group: `${idPre}${index}`,
            };
          }),
        };
        node.setProp({ ports });
        // render edge
        const edges = myEdge.getConfig(nodeConfig.edges);
        edges.forEach(edge => {
          graph.addEdge({
            ...edge,
          });
        });

      }, 50);

      return wrap;
    }
  },
  registerPortRender({ dm }) {
    return args => {
      const node = args.node;
      const originNode = dm.findNode(node.id);
      const nodeComponent = dm.getShapeComponent(originNode.shape);
  
      const selectors = args.contentSelectors
      const container = selectors && selectors.foContent
      if (container) {
        const portInst = nodeComponent[1];
        const Cpt = portInst.getComponent(originNode);
        render(createElement(Cpt, { ...originNode, data: portInst.data }), container);
      }  
    }
  },
};

export const Graph = {
  graph: null,

  getHtmlKey(n) {
    const registerKey = `${n || DEFAULT_SHAPE}-html`;
    return registerKey;
  },

  init(container, dm, config) {
    const graph = createFlowGraph(container, {
      ...config, 
      onPortRendered: Register.registerPortRender({
        dm,
      }),
    });
        
    const allShapeComponents = dm.getAllShapeComponents();

    allShapeComponents.forEach(([myNode, myPort, myEdge]) => {
      const registerKey = this.getHtmlKey(myNode.shape);

      Register.registerHTMLComponent(registerKey, Register.registerHTMLComponentRender({
        myNode,
        myPort,
        myEdge,
        dm,
        graph,
      }));  
    });

    this.graph = graph;
  },

  renderNodes(nodes) {
    nodes.forEach(node => {
      this.addNode(node);      
    });
  },

  addNode(nodeConfig) {
    const htmlKey = this.getHtmlKey(nodeConfig.shape);

    const nodeConfigView = nodeConfig.view;
    delete nodeConfig.view;

    const node = lodash.merge({
      ...nodeConfigView,
    }, nodeConfig, {
      shape: 'html',
      portMarkup: [ Markup.getForeignObjectMarkup() ],
      attrs: {
        rect: {
          fill: '#fff',
          stroke: '#000',
        },
      },
      html: htmlKey,
      ports: {},      
    });

    const x6NodeInstance = this.graph.addNode(node);
  },
  exportData() {
    return this.graph.toJSON();
  },
}


export const Connect = {
  transformNode(nodeConfig, [NodeCls, PortCls, EdgeCls]) {

  }
};


export const Data = {
  readNodes(nodeConfigArr) {
    
  }
}