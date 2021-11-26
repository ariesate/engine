/**
 * 由于定制的情况下，所以需要对原本的x6 data有会一些额外的属性拓展
 */
export namespace Axii {
  export type Component = any;
  export type Element = any;
}

interface IMarkup {
  tagName: string;
  selector: string;
  attrs: {};
  style: {};
  //...
}

export interface X6Edge{
  inherit: string | 'edge',
  attrs: {
    [selector: string]: {
      stroke: string,
    },
  },
  defaultLabel: {
    markup: IMarkup[];
    attrs: {
      [selector: string]: {
        stroke: string,
      },  
    },
    position: {
      distance: number,
      options: {
        absoluteDistance: boolean,
        reverseDistance: boolean,
      },
    },
  },
}

export interface IX6Cell {
  
  shape: 'rect' | string; // x6内置了很多基础图形，但使用的时候还是要自定义的，这里是要接入axii-component
  view?: string;
  // 可视信息
  zIndex?: number;
  visible?: boolean;
  // svg颜色属性
  attrs?: {
    [selector: string]: { // svg属性
      fill: string; // color hash
      stroke: string; // color
    }
  }
  // 
  markup?: IMarkup[];
  //
  parent?: {};
  children?: {}[];
  //
  data?: {};
}

export type IX6Node =  IX6Cell & IBBox & {
  id: string;
  angle?: number; // 旋转角度？
}

export interface IBBox {
  // 基本的位置信息, boundingRect
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface IX6Ddge {
  id: string;
  name: string;
  type: string;
  source: { 
    cell: string;
    port: string;
    [key: string]: string;
  };
  target: { 
    cell: string;
    port: string;
  };
}
