import {
  reactive,
} from 'axii';
import EventEmiter from 'eventemitter3';
import { IBBox, IX6Cell, IX6Node, IX6Edge } from '../basicTypes';
import { K6Edge, K6EdgeChild } from '../Edge';
import { IK6DataConfig, K6Node, K6NodeChild } from '../Node';
import { K6Port, K6PortChild } from '../Port';
import { cloneDeep } from 'lodash';

type IDataNode = IX6Node & {
  edges: IEdgeData[];
};
type IEdgeData = IX6Edge & {
  data: {
    [key: string]: any;
  };
  view?:{
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
  cacheSelected: {
    configData: { [k: string]: any }; // 镜像版本
  },
  graph: {
    zoom: number,
  }
}

export function fallbackEditorDataToNormal(myJson: IK6DataConfig) {
  function task(properties: IK6DataConfig['properties'], obj: any) {
    properties.forEach(prop => {
      switch (prop.type) {
        case 'number':
          obj[prop.name] = undefined;
          break;
        case 'boolean':
          obj[prop.name] = false;
          break;
        case 'string':
          obj[prop.name] = '';
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
  const data: any = fallbackEditorDataToNormal(k6Node.configJSON);

  const newNode = {
    id: Math.floor(((Math.random() * 10000))).toString(),
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
    this.nodes = (nodes.map(n => ({
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
          node.edges.push({
            ...edge,
            data: reactive(edge.data || {}),
          });
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
        data: reactive(n.data),
      });
      this.emit('addNode', n);
    }
  }
  addNewEdge(nodeId: string, edgeId: string) {
    const node = this.findNode(nodeId);
    node.edges.push({
      id: edgeId,
      data: reactive({}),
    });
  }
  findNode(id: string) {
    const n = this.nodes.find(n => n.id === id);
    return n ? {
      ...n,
    } : null;
  }
  findNodeAndEdge(id: string): [IDataNode?, IEdgeData?] {
    let edge: IEdgeData;
    const n = this.nodes.find(n => {      
      edge = n.edges.find(e => e.id === id);
      return !!edge || n.id === id;
    });
    return n ? [n, edge] : [];
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
    console.log('selectEdge: ', id);
    if (!id || this.insideState.selectedCellId === id) {
      Object.assign(this.insideState, {
        selectedConfigJSON: null,
        selectedConfigData: null,
        selectedCellId: '',
        cacheSelected: {
          configData: null,
        }
      });
      return;
    }

    const [node, edge] = this.findNodeAndEdge(id);
    if (node) {
      const [ _1, _2, edgeComponent ] = this.getShapeComponent(node.shape);
      Object.assign(this.insideState, {
        selectedConfigJSON: edgeComponent.configJSON,
        selectedConfigData: edge.data,
        selectedCellId: id,

        cacheSelected: {
          configData: cloneDeep(edge.data),
        }
      });
    }
  }
  triggerCurrentEvent(event: 'change' | 'save', data: any) {
    this.triggerEvent(this.insideState.selectedCellId, event, data);      
  }

  triggerEvent(cellId: string, event: 'change' | 'save', data: any) {
    if (!cellId) {
      return;
    }
    const [node, edge] = this.findNodeAndEdge(cellId);
    const [nodeComponent, _, edgeComponent] = this.getShapeComponent(node.shape);

    if (node) {
      // @TODO: 更新节点的画布属性    
      const position = this.dmx6.Graph.getNodePosition(cellId);
      if (position) {
        Object.assign(node, {
          x: position.x,
          y: position.y,
        });
      }
    }
    if (edge) {
      const newEdgeConfig = edgeComponent.getConfig(node, edge);
      const model = this.dmx6.Graph.updateEdge(edge, newEdgeConfig);
      Object.assign(edge, model, {
        data: edge.data,
      });
    }
    
    const oldConfigData = this.insideState.cacheSelected.configData;
    // 说明仅仅是边的修改
    if (edge) {
      switch (event) {
        case 'change':
          edgeComponent.onChange(node, edge, data, oldConfigData);
          break;
        case 'save':
          edgeComponent.onSave(node, edge, data, oldConfigData);
          break;
        }
    } else {
      switch (event) {
        case 'change':
          nodeComponent.onChange(node, data, oldConfigData);
          break;
        case 'save':
          nodeComponent.onSave(node, data, oldConfigData);
          break;
        }
    }
  }
  removeCurrent() {
    const currentCellId = this.insideState.selectedCellId;
    const [node, edge] = this.findNodeAndEdge(currentCellId);
    const [nodeComponent, _, edgeComponent] = this.getShapeComponent(node.shape);

    if (edge) {
      const i = node.edges.indexOf(edge);
      if (i >= 0) {
        node.edges.splice(i, 1);
        edgeComponent && edgeComponent.onRemove(node, edge);
      }
    } else {
      const i = this.nodes.indexOf(node);
      if (i >= 0) {
        this.nodes.splice(i, 1);
        nodeComponent && nodeComponent.onRemove(node);
      }  
    }
    this.emit('remove', currentCellId);
    this.selectNode(null);
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


