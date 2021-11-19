import {
  reactive,
} from 'axii';

import { IBBox, IX6Cell, IX6Node } from '../basicTypes';
import { K6Edge, K6EdgeChild } from '../Edge';
import { K6Node, K6NodeChild } from '../Node';
import { K6Port, K6PortChild } from '../Port';

type IDataNode = IX6Node;

type Group = [typeof K6NodeChild, typeof K6PortChild, typeof K6EdgeChild];

type ShapeComponent = [K6Node, K6Port, K6Edge];

class DataManager {
  nodes: IDataNode[] = [];
  nodeShapeComponentMap: Map<string, ShapeComponent> = new Map();
  constructor() {
  }
  readNodesData(nodes: IDataNode[]) {
    this.nodes = reactive(nodes);
  }
  findNode(id: string) {
    return this.nodes.find(n => n.id === id);
  }
  readComponents(groups: Group[]) {
    groups.forEach(group => {
      const [NodeCls, PortCls, EdgeCls] = group;
  
      const nodeComponent = new NodeCls();
      const portComponent = new PortCls(nodeComponent);
      const edgeComponent = new EdgeCls(nodeComponent);

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

  getShapeComponent(shapeName: string): ShapeComponent {
    let sc = this.nodeShapeComponentMap.get(shapeName);
    if (!sc) {
      sc = this.nodeShapeComponentMap.values().next().value;
    }
    return sc;  
  }
}

export default DataManager;
