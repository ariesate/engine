import { Axii, IBBox, IX6Cell, IX6Node } from './basicTypes';

import { K6Edge } from './Edge';
import { INodeViewProps, ITopState, K6Node } from './Node';

export interface INodePort extends Function {
  portConfig: IRegisterPortConfigProps[];
  RegisterPort: () => IRegisterPortConfigProps;
}

export interface IRegisterPortConfigProps {
  nodeId: string;
  portId: string;
  position: {
    x: number | string;
    y: number | string;
  }
  size?: {
    width: number;
    height: number;
  }
}
/**
 * 节点的连接点（可选）
 * Port有2种模式：自动，手动
 * 自动模式：x6内置了port的多种定位，但过于复杂，提供一个默认选项：自动，其它都手动
 * 手动模式：理论上对齐css只要有absolute，relative
 */
export abstract class K6Port {
  data: ITopState;
	// 连接点通常是简单图行，用Component渲染是否过重了
  abstract getComponent(index: number): Axii.Component;
  // 连接点的快捷位置，其实都通过计算x，y得到，是否有必要直接提供这种配置项
  position?: 'top' | 'left' | 'bottom' | 'right' | 'absolute';
  abstract bbox: IBBox;
  edges: K6Edge[] = [];
  // 通过register收集而来

  workNode: IX6Node = null;

  getConfig(nodeId: string): IRegisterPortConfigProps[] {
    return this.config.filter(c => c.nodeId === nodeId || !nodeId);
  }

  config: IRegisterPortConfigProps[] = [];

  constructor(public contextNode: K6Node | null) {
    contextNode.port = this;
  }

  abstract registerPortConfig(props: IRegisterPortConfigProps): Axii.Element;
}

export class K6PortChild extends K6Port {
  bbox: IBBox = { x:0, y: 0 };
  getComponent() {    
  }
  registerPortConfig() {
  }
}
