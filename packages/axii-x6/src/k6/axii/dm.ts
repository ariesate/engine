import {
  reactive,
} from 'axii';
import EventEmiter from 'eventemitter3';
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
  graph: {
    zoom: number,
  }
}

export function fallbackEditorDataToNormal(myJson: IK6DataConfig) {
  function task(properties: IK6DataConfig['properties'], obj: any) {
    properties.forEach(prop => {
      switch (prop.type) {
        case 'number':
        case 'boolean':
        case 'string':
          obj[prop.name] = undefined;
          break;
        case 'object':
          obj[prop.name] = {};
          task(prop.properties, obj[prop.name]);
          break;
        case 'array':
          {
            obj[prop.name] = [];
          }
          break;
      }
    });
    return obj;
  }
  const result = {};
  task(myJson.properties, result);
  return result;
}

function generateNodeByConfig(k6Node: K6Node) {
  const data = fallbackEditorDataToNormal(k6Node.configJSON);

  const newNode = {
    id: Math.random().toString(),
    shape: k6Node.shape,
    name: 'Page',
    data,
    x:30,
    y:30,
    edges: [],
  };

  return newNode;
}

class DataManager extends EventEmiter{
  nodes: IDataNode[] = [];
  nodeShapeComponentMap: Map<string, ShapeComponent> = new Map();
  data: ITopState | null = null;
  insideState:IInsideState = reactive({
    selectedCellId: '', // 包含节点和边
    selectedConfigJSON: null,
    graph: {
      zoom: 1,
    },
  });
  // x6/index.jsx
  dmx6: any;
  constructor() {
    super();
    window.dm = this;
  }
  setX6(x6: any) {
    this.dmx6 = x6;
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
  addNode() {
    // 先默认只支持一种
    if (1) {
      const nodeComponent: ShapeComponent = this.nodeShapeComponentMap.values().next().value;
      const n = generateNodeByConfig(nodeComponent[0]);
      this.nodes.push({
        ...n,
      });
      this.emit('addNode', n);
    }
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
    if (!id || this.insideState.selectedCellId === id) {
      Object.assign(this.insideState, {
        selectedConfigJSON: null,
        selectedConfigData: null,
        selectedCellId: '',
      });
      return;
    }
    const node = this.findNode(id);
    const [nodeComponent] = this.getShapeComponent(node.shape);
    Object.assign(this.insideState, {
      selectedConfigJSON: nodeComponent.configJSON,
      selectedConfigData: node.data,
      selectedCellId: id,
    });
  }
  selectEdge(id: string) {
  }
  triggerCurrentEvent(event: 'change' | 'save', data: any) {
    this.triggerNodeEvent(this.insideState.selectedCellId, event, data);      
  }

  triggerNodeEvent(nodeId: string, event: 'change' | 'save', data: any) {
    if (!nodeId) {
      return;
    }
    const node = this.findNode(nodeId);
    const [nodeComponent] = this.getShapeComponent(node.shape);

    // @TODO: 更新节点的画布属性    
    const position = this.dmx6.Graph.getNodePosition(nodeId);
    if (position) {
      Object.assign(node, {
        x: position.x,
        y: position.y,
      });
    }
    
    switch (event) {
      case 'change':
        nodeComponent.onChange(node, data);
        break;
      case 'save':
        nodeComponent.onSave(node, data);
        break;
      }
  }
  removeCurrent() {
    const i = this.nodes.findIndex(o => o.id === this.insideState.selectedCellId);
    const id = this.nodes[i]?.id;
    this.nodes.splice(i, 1);
    this.selectNode(null);
    this.emit('remove', id);
  }
  zoomIn() {
    this.insideState.graph.zoom += 0.2
    this.emit('zoom-in', 0.2);
  }
  zoomOut(){
    this.insideState.graph.zoom -= 0.2
    this.emit('zoom-out', 0.2);
  }
}

export default DataManager;


