import {
  reactive,
} from 'axii';

import { IBBox, IX6Cell, IX6Node, IX6Ddge } from '../basicTypes';
import { K6Edge, K6EdgeChild } from '../Edge';
import { IK6DataConfig, K6Node, K6NodeChild } from '../Node';
import { K6Port, K6PortChild } from '../Port';

type IDataNode = IX6Node & {
  edges: IEdgeData[];
};
type IEdgeData = IX6Ddge & {
  view:{
    sourcePortSide: 'right' | 'left';
    targetPortSide: 'left' | 'right';
  }
};

type Group = [typeof K6NodeChild, typeof K6PortChild, typeof K6EdgeChild];

type ShapeComponent = [K6Node, K6Port, K6Edge];

interface ITopState {
  [key: string]: any;
}

export interface IInsideState {
  selectedCellId: string;
  selectedConfigJSON: IK6DataConfig | null;
  selectedConfigData: { [k: string]: any };
}

class DataManager {
  nodes: IDataNode[] = [];
  nodeShapeComponentMap: Map<string, ShapeComponent> = new Map();
  data: ITopState | null = null;
  insideState:IInsideState = reactive({
    selectedCellId: '', // 包含节点和边
    selectedConfigJSON: null,
  });
  constructor() {
  }
  readState(obj: object) {
    this.data = reactive(obj);
  }
  readNodesData(nodes: IDataNode[]) {
    this.nodes = reactive(nodes.map(n => ({
      ...n,
      data: n.data ? reactive(n.data) : n.data,
      edges: [],
    })));
  }
  readEdgesData(edges: IEdgeData[]) {
    this.nodes.forEach(node => {
      const id = node.id;
      edges.forEach(edge => {
        const cell = edge.source.cell || edge.source.entity;
        if (cell === id) {
          node.edges.push(edge);
        }
      });
    });
  }
  addNode(n: IDataNode) {
    this.nodes.push({
      ...n,
      edges: [],
    });
  }
  findNode(id: string) {
    const n = this.nodes.find(n => n.id === id);
    return n ? {
      ...n,
    } : null;
  }
  readComponents(groups: Group[]) {
    groups.forEach(group => {
      const [NodeCls, PortCls, EdgeCls] = group;
  
      const nodeComponent = new NodeCls();
      const portComponent = new PortCls(nodeComponent);
      const edgeComponent = new EdgeCls(nodeComponent);

      [
        nodeComponent,
        portComponent,
        edgeComponent,
      ].forEach(c => c.data = this.data);
      
      this.nodeShapeComponentMap.set(nodeComponent.shape, [
        nodeComponent,
        portComponent,
        edgeComponent,
      ]);
    });
  }

  getAllShapeComponents(): ShapeComponent[] {
    return [
      ...this.nodeShapeComponentMap.values(),
    ];
  }
  
  getShapeComponentByNodeId(id: string): ShapeComponent {
    const { shape } = this.findNode(id);
    return this.getShapeComponent(shape);
  }

  getShapeComponent(shapeName: string): ShapeComponent {
    let sc = this.nodeShapeComponentMap.get(shapeName);
    if (!sc) {
      sc = this.nodeShapeComponentMap.values().next().value;
    }
    return sc;  
  }
  selectNode (id: string) {
    if (this.insideState.selectedCellId === id) {
      Object.assign(this.insideState, {
        selectedCellId: '',
        selectedConfigJSON: null,
        selectedConfigData: null,
      });
      return;
    }
    const node = this.findNode(id);
    const [nodeComponent] = this.getShapeComponent(node.shape);
    Object.assign(this.insideState, {
      selectedCellId: id,
      selectedConfigJSON: nodeComponent.configJSON,
      selectedConfigData: node.data,
    });
  }
  selectEdge(id: string) {
  }
}

export default DataManager;
