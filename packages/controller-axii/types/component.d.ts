import { Atom } from "./common";
import { VNode, CSSProperties, AxiiElement, Ref } from "./runtime-dom";

export interface PropTypes {
  string: PropTypes.WithDefault<string | Atom<string>>;
  number: PropTypes.WithDefault<number | Atom<number>>;
  object: PropTypes.WithDefault<object>;
  array: PropTypes.WithDefault<Array<any>>;
  bool: PropTypes.WithDefault<boolean | Atom<boolean>>;
  function: PropTypes.WithDefault<Function>;
  symbol: PropTypes.WithDefault<symbol>;
  any: PropTypes.WithDefault<any>;
  node: PropTypes.WithDefault<any>;
  element: PropTypes.WithDefault<AxiiElement>;
  elementType: PropTypes.WithDefault<
    string | FunctionComponent | AbstractComponent
  >;
  oneOf: <T>(...values: T[]) => PropTypes.Base<T>;
  oneOfType: (...types: PropTypes.Base<any>[]) => PropTypes.Base<any[]>;
  arrayOf: <T>(type: PropTypes.PropType<T>) => PropTypes.Base<T>;
}
export namespace PropTypes {
  export interface PropType<T> {}
  export interface Base<T> {
    /**
     * 标记为必填
     */
    readonly isRequired: Base<T>;
    (): PropType<T>;
  }
  export interface WithDefault<T> extends Base<T> {
    /**
     * 设置默认值
     * @param getter 返回值函数
     */
    default(getter: () => T): WithDefault<T>;
  }
}

export type FeatureProps<P> = { [K in keyof P]: Atom.Atomify<P[K]> };
export type AbstractProps<P> = { [K in keyof P]: Atom.Atomify<P[K]> | P[K] };

export interface FunctionComponent<P = {}> extends FeatureBase<P> {
  (props: FeatureProps<P> & { ref?: Ref; children?: AxiiElement }): JSX.Element;
  /**
   * 默认特性
   */
  Style?: Feature<P>;
}
export type FC<P = {}> = FunctionComponent<P>;
interface AbstractComponent<P = {}> {
  (props: AbstractProps<P>): JSX.Element;
}
export interface Component<P = {}> extends AbstractComponent<P> {
  /**
   * 创建继承组件
   * @param features 新特性
   * @returns 新组件
   */
  extend(...features: Feature<P>[]): Component<P>;
}
export namespace Feature {
  type StyleGetter<P> = (props: P) => CSSProperties;
  interface StyleSetter<P> {
    /**
     * 设置样式
     * @param style 样式或样式`getter`
     */
    style(style: CSSProperties | StyleGetter<P>): void;
  }
  interface PseudoSetter<P> {
    /**
     * 状态伪类
     */
    match: {
      /**
       * 悬停状态
       */
      hover: StyleSetter<P>;
      /**
       * 激活状态
       */
      active: StyleSetter<P>;
      /**
       * 聚焦状态
       */
      focus: StyleSetter<P>;
      /**
       * 已访问状态
       */
      visited: StyleSetter<P>;
    };
  }
  interface FragmentNode<P> extends StyleSetter<P>, PseudoSetter<P> {}

  export interface Fragment<P, S> {
    /**
     * 元素集合
     */
    readonly elements: Record<string, FragmentNode<P>>;
    /**
     * 准备阶段
     * @description
     * - 于`Feature.match()`之后执行
     * - 于`modify()`之前执行
     * - 返回的`State`数据可在`style()`/`modify()`或之后的`prepare()`中访问
     */
    readonly prepare: (func: (props: P & Partial<S>) => Partial<S>) => void;
    /**
     * 修改阶段
     * @description
     * - 于`prepare()`之后执行
     * - 于`style()`之前执行
     */
    readonly modify: (func: (node: VNode, props: P & S) => void) => void;
  }
  export interface Fragments<P, S> {
    /**
     * 根结点
     */
    readonly root: Fragment<P, S>;
    readonly [x: string]: Fragment<P, S>;
  }
}
export interface Feature<P = {}, S = {}> extends FeatureBase<P> {
  (fragments: Feature.Fragments<FeatureProps<P>, S>): void;
}
interface FeatureBase<P> {
  /**
   * 属性声明
   */
  propTypes?: { [K in keyof P]?: PropTypes.Base<P[K]> };
  /**
   * 转发`ref`
   */
  forwardRef?: boolean;
  /**
   * Feature启用计算函数
   * @description 请勿在函数中使用`atom.value`进行比较
   * @example DarkFeature.match = ({ dark }) => dark;
   */
  match?: (props: FeatureProps<P>) => boolean | Atom<boolean>;
  methods?: any;
}

/**
 * 属性声明
 */
export const propTypes: Readonly<PropTypes>;
/**
 * Fragment节点, 可简写为`<></>`
 */
export const Fragment: AbstractComponent;

export function createElement(
  name: string,
  attributes?: any,
  ...children: any[]
): JSX.Element;
export function createElement<P>(
  type: FunctionComponent<P>,
  props?: Partial<P>,
  ...children: any[]
): JSX.Element;
export function createElement<P>(
  type: AbstractComponent<P>,
  props?: Partial<P>,
  ...children: any[]
): JSX.Element;

/**
 * 创建组件
 * @param type 组件Base
 */
export function createComponent<P>(type: FunctionComponent<P>): Component<P>;
/**
 * 创建组件
 * @param type 组件Base
 * @param features 特性
 */
export function createComponent<Q, P extends Q>(
  type: FunctionComponent<P>,
  features: Feature<Q>[]
): Component<P>;

/**
 * 渲染元素
 * @param element 元素
 * @param container 容器
 */
export function render(
  element: JSX.Element,
  container: Element | Document | DocumentFragment
): void;

export function createPortal(
  element: JSX.Element,
  container: Element | Document | DocumentFragment
): JSX.Element;

export function cloneElement(
  element: JSX.Element,
  attributes?: Record<string, any>,
  ...children: AxiiElement[]
): JSX.Element;

export function shallowCloneElement(element: JSX.Element): JSX.Element;

// TODO:
export const normalizeLeaf: any;
