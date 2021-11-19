import { X6Edge } from "./basicTypes";
import { K6Node } from './Node';


export abstract class K6Edge {
  constructor (public target: K6Node) {
  }
	// 同上，边线也通常是更简单的线，是否必要用Component渲染，或者默认模式
  // 边线实在太简单了，还是用config
  abstract getConfig(index: number, portIndex: number): X6Edge | void;
}

export class K6EdgeChild extends K6Edge {
  getConfig() {}
}