/** @jsx createElement */
import { createFlowGraph } from './graph';
import { Graph as X6Graph, Markup } from '@antv/x6'
import lodash from 'lodash';
import { createElement, render, useRef } from "axii";
import { DEFAULT_SHAPE } from '../../Node';

export const Register = {
  register(nodeConfig) {

  },
  htmlComponentMap: new Map(),
  registerHTMLComponent(name, func) {
    if (!this.htmlComponentMap.get(name)) {
      this.htmlComponentMap.set(name, func);
      X6Graph.registerHTMLComponent(name, func);
    }
  }
};

export const Graph = {
  graph: null,

  getHtmlKey(n) {
    const registerKey = `${n || DEFAULT_SHAPE}-html`;
    return registerKey;
  },

  init(container, dm, config) {
    const graph = createFlowGraph(container, dm, config);
        
    const allShapeComponents = dm.getAllShapeComponents();

    allShapeComponents.forEach(([myNode]) => {
      const registerKey = this.getHtmlKey(myNode.shape);

      Register.registerHTMLComponent(registerKey, (node) => {
        const wrap = document.createElement('div')
        
        const Cpt = myNode.getComponent();

        const nodeConfig = dm.findNode(node.id);
        window.fff = nodeConfig.fields;
        
        render(<Cpt name={nodeConfig.name} fields={nodeConfig.fields} />, wrap);
  
        return wrap;
      });  
    });

    this.graph = graph;
  },

  addNode(nodeConfig, [myNode, myPort, myEdge]) {
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
    });

    const x6NodeInstance = this.graph.addNode(node);
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