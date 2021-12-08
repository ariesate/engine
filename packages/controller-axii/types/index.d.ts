import type { Properties } from "csstype";
import { VNode, AxiiElement } from "./runtime-dom";
export * from "./runtime-dom";

export interface Atom<T = any> {
  value?: T;
}
export namespace Atom {
  export type Unwrap<T> = T extends Atom<infer P> ? P : T;
  export type Props<P> = { [K in keyof P]: Atom<P[K]> };
}

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
  element: PropTypes.WithDefault<any>;
  elementType: PropTypes.WithDefault<any>;
  oneOf: <T>(...values: T[]) => PropTypes.Base<T>;
  oneOfType: (...types: PropTypes.Base<any>[]) => PropTypes.Base<any[]>;
  arrayOf: <T>(type: PropTypes.Base<T>) => PropTypes.Base<T>;
}
export namespace PropTypes {
  export interface Base<T> {
    /**
     * 标记为必填
     */
    readonly isRequired: Base<T>;
  }
  export interface WithDefault<T> extends Base<T> {
    /**
     * 设置默认值
     * @param getter 返回值函数
     */
    default(getter: () => T): WithDefault<T>;
  }
}

export interface FunctionComponent<P = {}> {
  (props: Atom.Props<P>): JSX.Element;
  /**
   * 默认特性
   */
  Style?: Feature<P>;
}
export type FC<P = {}> = FunctionComponent<P>;
interface AbstractComponent<P = {}> {
  (props: Atom.Props<P>): JSX.Element;
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
  export type StyleObject = Properties;
  type StyleGetter<P> = (props: P) => StyleObject;
  interface StyleSetter<P> {
    /**
     * 设置样式
     * @param style 样式或样式`getter`
     */
    style(style: StyleObject | StyleGetter<P>): void;
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
export interface Feature<P = {}, S = {}> {
  (fragments: Feature.Fragments<Atom.Props<P>, S>): void;
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
  match?: (props: Atom.Props<P>) => boolean | Atom<boolean>;
  methods?: any;
}

export interface DraftData<T> {
  /**
   * 可修改的副本（只影响`displayValue`不会影响数据源，只受数据源影响）
   */
  draftValue: T;
  /**
   * 只读副本（受`draftValue`和数据源的影响）
   */
  displayValue: Readonly<T>;
}

export type DelegatedSource<T> = T extends Array<infer P>
  ? Array<Atom<P>>
  : T extends {}
  ? { [K in keyof T]: Atom<T[K]> }
  : never;

export function createElement(
  name: string,
  attributes?: any,
  ...children: any[]
): any;
/**
 * 创建组件
 * @param type 组件Base
 * @param features 特性
 */
export function createComponent<P>(
  type: FunctionComponent<P>,
  features?: Feature<P>[]
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
/**
 * 创建独立的响应式值
 * @param initial 初始值
 * @returns 可变的响应式对象
 */
export function atom<T>(initial: T): Atom<Atom.Unwrap<T>>;
/**
 * 创建响应式状态
 * @param value 值
 * @returns 响应式的对象状态
 */
export function reactive<T>(value: T): T;
/**
 * 接受一个`getter`函数，并根据`getter`的返回值返回一个不可变的响应式`atom`对象
 * @param getter 计算函数
 * @returns 计算后的不可变响应式`atom`对象
 */
export function computed<T>(getter: () => T): Atom<T>;
/**
 * 接受一个`getter`函数，并根据`getter`的返回值返回一个不可变的响应式`atom`对象
 * @param getter 计算函数
 * @returns 计算后的不可变响应式`atom`对象
 * @description 适用于计算数据不需要深度监听时
 */
export function atomComputed<T>(getter: () => T): Atom<T>;
/**
 * 接受一个`getter`函数，并根据`getter`的返回值返回一个vnode
 * @param getter 计算函数
 * @returns 计算后的vnode
 * @description 函数节点会自动包装成`vnodeComputed，一般不需要显式调用
 */
export function vnodeComputed(getter: () => AxiiElement): VNode;
/**
 * 侦听特定的数据源，并在单独的回调函数中执行副作用
 * @param getter 计算函数
 * @param cb 副作用回调
 */
export function watch(getter: () => any, cb: () => void): void;
/**
 * 侦听特定的数据源，并在单独的回调函数中执行副作用
 * @param data 数据源
 * @param cb 副作用回调
 * @description 等同于`watch(() => traverse(data), cb)`
 */
export function watchReactive(data: any, cb: () => void): void;
/**
 * 从数据源创建响应式副本
 * @param source 数据源
 */
export function draft<T>(source: T): DraftData<T>;
/**
 * 获取一个可以将子节点变为响应式的代理节点
 * @param parent 父节点
 * @example
 * const parent = reactive([1, 2, 3]);
 * const leaf = delegateLeaf(parent)[0];
 * leaf.value += 1;
 * console.log(parent);
 * // [2, 2, 3]
 */
export function delegateLeaf<T>(parent: T): DelegatedSource<T>;
/**
 * 属性声明
 */
export const propTypes: Readonly<PropTypes>;
export const Fragment: AbstractComponent;
export function useViewEffect(fn: () => void): void;
export function useViewEffect(fn: () => () => void): void;
export const version: string;
// TODO:
export const createPortal: any;
export const cloneElement: any;
export const normalizeLeaf: any;
export const shallowCloneElement: any;
export const isAtom: any;
export const isReactive: any;
export const atomLike: any;
export const delegateLeaves: any;
export const asAtom: any;
export const createComputed: any;
export const destroyComputed: any;
export const startScope: any;
export const unsafeComputeScope: any;
export const replace: any;
export const findIndepsFromDep: any;
export const findDepsFromIndep: any;
export const spreadUnchangedInScope: any;
export const debounceComputed: any;
export const getComputation: any;
export const collectComputed: any;
export const cachedComputations: any;
export const observeComputation: any;
export const getIndepTree: any;
export const observeTrigger: any;
export const isReactiveLike: any;
export const toRaw: any;
export const getDisplayName: any;
export const setDisplayName: any;
export const collectReactive: any;
export const useImperativeHandle: any;
export const createRef: any;
export const useRef: any;
export const traverse: any;
export const watchOnce: any;
export const autorun: any;
export const StyleEnum: any;
export const StyleRule: any;
export const createFlatChildrenProxy: any;
export const isComponentVnode: any;
export const useContext: any;
export const createContext: any;
export const createSmartProp: any;
export const overwrite: any;
export const disableDraft: any;
export const invariant: any;
export const tryToRaw: any;
export const shallowEqual: any;
export const createBufferedRef: any;
export const deferred: any;
export const flattenChildren: any;
export const Scenario: any;
export const createRange: any;
export const matrixMatch: any;
export const batchOperation: any;
export const isDraft: any;
export const getDisplayValue: any;
