import {
  atom,
  reactive,
} from 'axii';
import EventEmiter from 'eventemitter3';
import { IX6Node, IX6Edge } from '../basicTypes';
import { INodeEdge } from '../Edge';
import { IK6DataConfig, INodeComponent } from '../Node';
import { INodePort } from '../Port';
import merge from 'lodash-es/merge';
import cloneDeep from 'lodash-es/cloneDeep';

type IDataNode = IX6Node & {
  data?: {
    [k: string]: any;
    x: number;
    y: number;
  };
  edges: IEdgeData[];
  prev: IDataNode[];
  next: IDataNode[];
  cellType: string;
};
type IEdgeData = IX6Edge & {
  remoteId?: string | number;
  data: {
    [key: string]: any;
  };
  view?:{
    sourcePortSide: 'right' | 'left' | 'top' | 'bottom';
    targetPortSide: 'left' | 'right' | 'top' | 'bottom';
  };
  cellType: string
};
type INodePropKeys = keyof IDataNode;

type Group = [INodeComponent, INodePort, INodeEdge];

type ShapeComponent = [INodeComponent, INodePort, INodeEdge];

interface ITopState {
  [key: string]: any;
}

type INodeComponentEvent = 'change' | 'save' | 'remove' | 'add';

export interface IInsideState {
  selected: {
    cell: IDataNode,
    nodeComponent: INodeComponent,
    multiCell: IDataNode[]
  }
  cacheSelected: {
    cell: { [k: string]: any }; // 镜像版本，用以对比数据
    multiCell: { [k: string]: any }[]
  },
  graph: {
    zoom: number,
    type: string,
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
  if (myJson) {
    task(myJson.properties, result);
  }
  return result;
}

let newAddIndex = 1;

function generateNodeByConfig(k6Node: INodeComponent, initNodeProp?: { x?:number, y?:number }) {
  const data: any = fallbackEditorDataToNormal(k6Node.configJSON);

  if (Reflect.has(data, 'x') || Reflect.has(data, 'y')) {
    throw new Error('[generateNodeByConfig] x, y is preserved prop name')
  }
  const newNode = {
    id: Math.floor(((Math.random() * 10000))).toString(),
    shape: k6Node.shape,
    name: '',
    data: {
      ...data,
    },
    x:30 * newAddIndex,
    y:30 * newAddIndex,
    edges: [],
    prev: [],
    next: [],
    selected: false,
    isGroupNode: false,
    cellType: 'node'
  };
  newAddIndex++;

  if (initNodeProp) {
    Object.assign(newNode, initNodeProp);
  }

  Object.assign(newNode.data, {
    x: newNode.x,
    y: newNode.y,
  });
  
  return newNode;
}

class NodeManager {
  nodes: IDataNode[] = [];

  readNodes(nodes: (IDataNode & { x:number; y:number })[]) {
    this.nodes = nodes.map(n => {
      const p = {
        x: n.x,
        y: n.y,
      };
      const data = n.data ? Object.assign({}, n.data, p): p;

      return {
        ...n,
        data: reactive(data),
        edges: reactive([]),
        prev: reactive([]),
        next: reactive([]),
        cellType: 'node'
      }
    });
  }
  readEdges(edges: IEdgeData[]) {
    this.nodes.forEach(node => {
      const id = node.id;
      edges.forEach(edge => {
        const cell = edge.source.cell || edge.source.entity;
        if (cell === id) {          
          node.edges.push({
            ...edge,
            cellType: 'edge',
            data: reactive(edge.data || {}),
          });
        }
      });
    });

    this.initNodeLinkNet();
  }
  initNodeLinkNet() {
    // 确保情况
    const relations = this.nodes.map((n) => {
      return {
        [n.id]: {
          prev: new Set<string>(),
          next: new Set<string>(),  
        }
      };
    }).reduce((p, n) => Object.assign(p, n), {});

    this.nodes.forEach(sourceNode => {
      const sourceRelation = relations[sourceNode.id];

      sourceNode.edges.forEach(edge => {
        const targetId = edge.target.cell;
        const targetRelation = relations[targetId];
        if (targetId && targetRelation) {
          sourceRelation.next.add(targetId);
          targetRelation.prev.add(sourceNode.id);
        }
      });
    });

    this.nodes.forEach(n => {
      const relation = relations[n.id];
      n.prev = reactive([...relation.prev].map(id => this.findNode(id, false)));
      n.next = reactive([...relation.next].map(id => this.findNode(id, false)));
    });
  }

  addNewNode(n: IDataNode){
    n.data = reactive(n.data);
    n.prev = reactive(n.prev);
    n.next = reactive(n.next);
    this.nodes.push(n);
  }
  addEdge(nodeId: string, edge: IEdgeData) {
    const n = this.findNode(nodeId, false);
    n.edges.push(edge);

    const nextNode = this.findNode(edge.target.cell, false);
    if (nextNode) {
      nextNode.prev.push(n);
      n.next.push(nextNode);  
    }
  }
  findEdgeById(edgeId: string): IEdgeData | null {
    let edge = null;
    this.nodes.forEach(n => {
      const e = n.edges.find(e => e.id === edgeId);
      if (e) {
        edge = e;
      }
    });
    return edge;
  }
  findEdges(id: string) {
    const edges = [];
    this.nodes.forEach(n => {
      if (n.id === id) {
        edges.push(...n.edges);
      } else {
        n.edges.forEach(e => {
          if (e.target.cell === id) {
            edges.push(e);
          }
        });
      }
    });
    return edges;
  }
  findNode(id: string, clone = true) {
    const n = this.nodes.find(n => n.id === id);
    if (!n) {
      return null
    }
    return clone ? {
      ...n,
    } : n;
  }
  findNodeAndEdge(id: string): [IDataNode?, IEdgeData?] {
    let edge: IEdgeData;
    const n = this.nodes.find(n => {      
      edge = n.edges.find(e => e.id === id);
      return !!edge || n.id === id;
    });
    return n ? [n, edge] : [];
  }
  removeNode(id: string): boolean {
    let i = -1;
    this.nodes.forEach((n, fi) => {
      if (n.id === id) {
        i = fi;
      }
    });
    if (i >= 0) {
      const currentNode = this.nodes[i];
      // 清理next里的当前节点
      currentNode.next.forEach(nextNode => {
        const fi = nextNode.prev.findIndex(n => n.id === currentNode.id);
        if (fi >= 0) {
          nextNode.prev.splice(fi, 1);
        }
      });
      // 清理prev的当前节点
      currentNode.prev.forEach(prevNode => {
        const fi = prevNode.next.findIndex(n => n.id === currentNode.id);
        if (fi >= 0) {
          prevNode.next.splice(fi, 1);
        }
        const resovedEdges = prevNode.edges.filter(e => e.target.cell === currentNode.id)
        resovedEdges.forEach(removedEdge => {
          const ei = prevNode.edges.findIndex(e => e.id === removedEdge.id) 
          if(ei >=0){
            prevNode.edges.splice(ei, 1)
          }
        })
      });

      this.nodes.splice(i, 1);
      return true;
    }
  }
  removeEdge(edgeId: string): boolean {
    let i = -1;
    let targetNodeId
    const currentNode = this.nodes.find(n => {      
      return n.edges.find((e, fi) => {
        const r = e.id === edgeId;
        if (r) {
          i = fi;
          targetNodeId = e.target.cell;
        }
        return r;
      });
    });
    if (currentNode && i >= 0) {
      currentNode.edges.splice(i, 1);
      const removedNextIndex = currentNode.next.findIndex(n => n.id === targetNodeId);
      const nextNode = currentNode.next[removedNextIndex];
      if (nextNode) {
        const removedPrevInNextNodeIndex = nextNode.prev.findIndex(n => n.id === currentNode.id);
        // 清理next的prev
        nextNode.prev.splice(removedPrevInNextNodeIndex, 1);
        // 清理next
        currentNode.next.splice(removedNextIndex, 1);
      }
      return true;
    }
  }
}

/**
 * 在readonly下阻断函数的执行
 */
function disabledByReadOnly (target, name, descriptor) {
  const old = descriptor.value

  if (old.constructor.name === "Function") {
    descriptor.value = function (...args: any[]) {
      if (this.readOnly.value) {
        return
      }
      return old.apply(this, args)
    }  
  } else if (old.constructor.name === "AsyncFunction") {
    descriptor.value = async function (...args: any[]) {
      if (this.readOnly.value) {
        return
      }
      return old.apply(this, args)
    }
  }
  return descriptor
}

class DataManager extends EventEmiter{
  nm  = new NodeManager();
  nodeShapeComponentMap: Map<string, ShapeComponent> = new Map();
  data: ITopState | null = null;
  insideState:IInsideState = reactive({
    selected: {
      cell: null,
      nodeComponent: null, 
      multiCell: null
    },
    cacheSelected: {
      cell: null,
      multiCell: null,
    },
    graph: {
      zoom: 1,
      type: '',
    },
  });
  // x6/index.jsx
  dmx6: any;
  shareContextValue: any = null;
  readOnly = atom(false)
  constructor() {
    super();
    // @ts-ignore
    window.dm = this;
  }
  setX6(x6: any) {
    this.dmx6 = x6;
  }
  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly
  }
  registerShareValue(shareContextValue: any) {
    this.shareContextValue = shareContextValue;
  }
  readState(obj: object) {
    this.data = reactive(obj);
  }
  readNodesData(nodes: (IDataNode & { x:number; y:number })[]) {
    this.nm.readNodes(nodes);
  }
  readEdgesData(edges: IEdgeData[]) {
    this.nm.readEdges(edges)
  }
  @disabledByReadOnly
  async addNode(initNode?: { x?:number, y?:number, isGroupNode?:boolean }, parentId: string = null) {
    // 先默认只支持一种
    if (1) {
      const nodeComponent: ShapeComponent = this.nodeShapeComponentMap.values().next().value;
      const n = generateNodeByConfig(nodeComponent[0], initNode);
      const newNode = {
        ...n,
      };
      
      const notifiedNode = await this.notifyShapeComponent(n, null, 'add', newNode.data);
      merge(newNode, notifiedNode);

      this.nm.addNewNode(newNode);
      if(!!parentId){
        this.emit('addChildNode',{childNode:newNode,id:parentId})
      }else{
        this.emit('addNode', newNode);
      }
    }
  }
  @disabledByReadOnly
  // 新增子节点
  async addChildNode(id: string) {
    const parentNode = this.findNode(id)
    if(parentNode){
      const childNum = parentNode.next.length+1
      await this.addNode({x:parentNode.x+200*childNum,y:parentNode.y+200+10*childNum},id)
    }
  }
  @disabledByReadOnly
  // 新增兄弟节点
  async addBroNode(id: string) {
    const broNode = this.findNode(id)
    if(broNode){
      const parentNode = broNode.prev.length>0?broNode.prev[0]:null
      if(parentNode){
        await this.addChildNode(parentNode.id)
      } else {
        await this.addNode()
      }
    }
  }
  @disabledByReadOnly
  async addNewEdge(nodeId: string, edge: IEdgeData) {
    const node = this.findNode(nodeId);
    if (node) {
      const newEdge = {
        ...edge,
        data: reactive(edge.data || {}),
        id: null,
        cellType: 'edge'
      };
      const r = await this.notifyShapeComponent(node, newEdge, 'add', {});

      newEdge.id = r ? r.id : edge.id;
      this.nm.addEdge(nodeId, newEdge);

      if (r) {
        return r.id;
      }
  }
  }
  /**
   * 更新DM中的边数据
   * @param nodeId 
   * @param props 
   */
  syncEdge(edgeId: string, props: { id?: string }, syncToGraph: boolean) {
    let edge = this.nm.findEdgeById(edgeId);
    if (edge) {
      merge(edge, props);
      if (syncToGraph) {
        this.emit('node:changed', {
          prop: props,
          type: 'edge',
          id: edgeId
        })
      }
    }
  }
  /**
   * 更新DM中的节点数据
   * @param nodeId 
   * @param props 
   */
  syncNode(nodeId: string, props: { [k in INodePropKeys]: any }, syncToGraph: boolean) {
    const node = this.findNode(nodeId);
    if (node) {
      const propKeys = Object.keys(props || {});
      if (propKeys.includes('x') && propKeys.includes('y')) {
        // this.emit('node:position:changed',{node:node,x:props.x,y:props.y})
        merge(node, props, { data: {
          x: props.x,
          y: props.y,
        }});
      } else {
        merge(node, props);
      }
      if (syncToGraph) {
        this.emit('node:changed', {
          prop: props,
          type: 'node',
          id: nodeId
        })
      }
    }
  }
  findEdges(id: string) {
    return this.nm.findEdges(id);
  }
  findNode(id: string) {
    return this.nm.findNode(id);
  }
  findNodeAndEdge(id: string): [IDataNode?, IEdgeData?] {
    return this.nm.findNodeAndEdge(id);
  }
  readComponents(groups: Group[]) {
    groups.forEach(group => {
      const [NodeCpt, PortCpt, EdgeFunc] = group;

      if (!NodeCpt.shape) {
        throw new Error(`[Node Componnet] ${NodeCpt.name} must have 'shape' prop`);
      }
      this.nodeShapeComponentMap.set(NodeCpt.shape, [
        NodeCpt,
        PortCpt,
        EdgeFunc,
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
  @disabledByReadOnly
  selectNode (id: string) {
    this.cancelSelectNodeOrEdge()
    if (!id ) {
      Object.assign(this.insideState, {
        selected: {
          cell: null,
          nodeComponent: null,
          multiCell: null
        },
        cacheSelected: {
          cell: null,
          multiCell: null
        },
      });
      return;
    }
    const node = this.findNode(id);
    const [nodeComponent] = this.getShapeComponent(node.shape);
    Object.assign(this.insideState, {
      selected: {
        cell: node,
        nodeComponent: nodeComponent,  
        multiCell: null
      },
      cacheSelected: {
        cell: cloneDeep(node),
        multiCell: null
      },
    });
    nodeComponent.onSelect && nodeComponent.onSelect(node)
  }
  @disabledByReadOnly
  multiSelectNode (array: string[]) {
    const nodeArray = array.map(id=>this.findNode(id))
    const [nodeComponent] = this.getShapeComponent(nodeArray[0].shape);
    Object.assign(this.insideState, {
      selected: {
        cell: null,
        nodeComponent: nodeComponent,  
        multiCell: nodeArray
      },
      cacheSelected: {
        cell: null,
        multiCell: cloneDeep(nodeArray)
      },
    });
  }
  @disabledByReadOnly
  selectEdge(id: string) {
    this.cancelSelectNodeOrEdge()
    if (!id || this.insideState.selected.cell?.id === id) {
      Object.assign(this.insideState, {
        selected: {
          cell: null,
          nodeComponent: null,  
          multiCell: null
        },
        cacheSelected: {
          cell: null,
          multiCell: null
        },
      });
      return;
    }

    const [node, edge] = this.findNodeAndEdge(id);
    if (node) {
      const [ _1, _2, edgeComponent ] = this.getShapeComponent(node.shape);
      Object.assign(this.insideState, {
        selected: {
          cell: edge,
          nodeComponent: edgeComponent,  
          multiCell: null
        },
        cacheSelected: {
          cell: cloneDeep(edge),
          multiCell: null
        },
      });
      edgeComponent.onSelect && edgeComponent.onSelect(edge)
    }
  }
  cancelSelectNodeOrEdge(){
    const {cell, nodeComponent} = this.insideState.selected
    if(!cell) return 
    nodeComponent.onCancelSelect && nodeComponent.onCancelSelect(cell)
  }
  triggerCurrentEvent(event: INodeComponentEvent, data: any) {
    this.triggerEvent(this.insideState.selected.cell?.id, event, data, this.insideState.selected.cell?.cellType || 'node');      
  }

  async notifyShapeComponent(node: IDataNode, edge: IEdgeData, event: INodeComponentEvent, data: any) {
    const [nodeComponent, _, edgeComponent] = this.getShapeComponent(node.shape);

    const oldConfigData = this.insideState.cacheSelected.cell?.data || {};

    let targetComponent = !!edge ? edgeComponent : nodeComponent;
    let args: any[] = !!edge ? [node, edge, data, oldConfigData] : [node, data, oldConfigData];
    // 有edge，说明仅仅是针对边的修改
    switch (event) {
      case 'change':
        return targetComponent.onChange && targetComponent.onChange.apply(targetComponent, args);
      case 'save':
        return targetComponent.onSave && targetComponent.onSave.apply(targetComponent, args);
      case 'add': {
        if (targetComponent.onAdd) {
          const r = await targetComponent.onAdd.apply(targetComponent, args);
          if (!r || ( r && r.id === undefined)) {
            throw new Error('onAdd method must have return result with id');
          }
          return r;
        }
      }
    }
  }

  triggerEvent(cellId: string, event: INodeComponentEvent, data: any, cellType: string) {
    if (!cellId) {
      return;
    }
    const [node, edge] = cellType==='edge' ? this.findNodeAndEdge(cellId) : [this.findNode(cellId), null];

    this.notifyShapeComponent(node, edge, event, data);
  }
  removeIdOrCurrent(targetId: string, cellType: string) {
    const currentCellId = targetId ? targetId : this.insideState.selected.cell.id;
    const currentType = cellType ? cellType : this.insideState.selected.cell?.cellType;
    const [node, edge] = currentType === 'edge' ? this.findNodeAndEdge(currentCellId) : [this.findNode(currentCellId), null];
    const [nodeComponent, _, edgeComponent] = this.getShapeComponent(node.shape);

    if (edge) {
      const removed = this.nm.removeEdge(edge.id);
      if (removed) {
        edgeComponent && edgeComponent.onRemove && edgeComponent.onRemove(node, edge);
      }
    } else {
      const removed = this.nm.removeNode(node.id);
      if (removed) {
        nodeComponent && edgeComponent.onRemove && nodeComponent.onRemove(node);
      }  
    }
    this.emit('remove', {id: currentCellId, cellType: currentType});
    this.selectNode(null);
  }
  zoomIn(v:number=0.2) {
    this.emit('zoom-in', v);
  }
  zoomOut(v:number=0.2){
    this.emit('zoom-out', v);
  }
  centerContent() {
    this.emit('center-content');
  }
  centerPoint(x:number,y:number) {
    this.emit('center-point', {x, y})
  }

  dispose() {
    this.emit('dispose');
  }

  resize(width:number,height:number) {
    this.emit('resize', {width:width,height:height})
  }
}

export default DataManager;


