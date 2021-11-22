import { Axii, IBBox } from './basicTypes';

import { K6Edge } from './Edge';
import { INodeViewProps, ITopState, K6Node } from './Node';

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

  abstract getPortConfig(data?: INodeViewProps): { 
    counts: number;
    size: number[];
  };

  constructor(public contextNode: K6Node | null) {
  }
}

export class K6PortChild extends K6Port {
  bbox: IBBox = { x:0, y: 0 };
  getPortConfig() {
    return { counts: 0, size: [0, 0] };
  }
  getComponent() {    
  }
}
