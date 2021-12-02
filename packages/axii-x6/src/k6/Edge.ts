import { IX6Cell, IX6Edge, X6Edge } from "./basicTypes";
import { IK6DataConfig, ITopState, K6Node } from './Node';

export abstract class K6Edge {
  router: string = 'manhattan';
  data: ITopState;
  configJSON: IK6DataConfig | null = null;
  constructor (public target: K6Node) {
  }
  onChange(node: IX6Cell, edge: IX6Edge, data: any) {
  }
  onSave(node: IX6Cell, edge: IX6Edge, data: any) {
  }
  onRemove(node: IX6Cell, edge: IX6Edge){    
  }
	// 同上，边线也通常是更简单的线，是否必要用Component渲染，或者默认模式
  // 边线实在太简单了，还是用config
  abstract getConfig(nodeConfig:IX6Cell, edgeConfig: IX6Edge): X6Edge | void;
}

export class K6EdgeChild extends K6Edge {
  getConfig() {}
}