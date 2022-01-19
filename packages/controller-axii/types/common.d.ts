import { VNode, AxiiElement, Ref, RefObject } from "./runtime-dom";

type SimpleType =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined;
export interface Atom<T> {
  value?: T;
}
export namespace Atom {
  export type Unwrap<T> = T extends Atom<infer P> ? P : T;
  export type Props<P> = { [K in keyof P]: Atom<P[K]> };
}
export type DelegatedSource<T> = T extends Array<infer P>
  ? Array<Atom<P>>
  : T extends {}
  ? { [K in keyof T]: Atom<T[K]> }
  : never;
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
export class Context<T> {}

/**
 * 创建独立的响应式值
 * @param initial 初始值
 * @param isComputed 是否为计算属性
 * @returns 可变的响应式对象
 */
export function atom<T>(initial: T, isComputed?: boolean): Atom<Atom.Unwrap<T>>;
export function isAtom(value: any, strict?: boolean): boolean;
export function atomLike<T>(value: T): Atom<T>;
export function asAtom<T, P>(item: T, parent: P, key: keyof P): Atom<T>;
/**
 * 创建响应式状态
 * @param value 值
 * @param isComputed 是否为计算属性
 * @returns 响应式的对象状态
 */
export function reactive<T>(value: T, isComputed?: boolean): T extends SimpleType? never: T;
/**
 * 判断一个值是否为reactive对象
 * @param value 值
 */
export function isReactive(value: any): boolean;
/**
 * 判断值是否为`reactive`或`atom`对象
 * @param value 值
 */
export function isReactiveLike(value: any): boolean;
export function toRaw<T>(value: T): T;
export function toRaw<T>(value: T, unwrap: true): Atom.Unwrap<T>;
/**
 * 接受一个`getter`函数，并根据`getter`的返回值返回一个不可变的响应式`atom`对象
 * @param getter 计算函数
 * @param shallow 是否浅比较
 * @returns 响应式对象
 */
export function computed<T>(
  getter: () => T,
  shallow?: boolean
): T extends SimpleType ? Atom<T> : T;
export function debounceComputed(func: () => void): void;
/**
 * 接受一个`getter`函数，并根据`getter`的返回值返回一个不可变的响应式`atom`对象
 * @param getter 计算函数
 * @returns `atom`对象
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
 * @param immediate 立即执行
 */
export function watch(
  getter: () => any,
  cb: () => void,
  immediate?: boolean
): void;
export function watchOnce(
  getter: () => any,
  cb: () => void,
  immediate?: boolean
): void;
export function traverse(value: any): any;
/**
 * 侦听特定的数据源，并在单独的回调函数中执行副作用
 * @param data 数据源
 * @param cb 副作用回调
 * @description 等同于`watch(() => traverse(data), cb)`
 */
export function watchReactive(data: any, cb: () => void): void;
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
 * 将一个对象的所有属性转变为响应式
 * @param parent 父节点
 */
export function delegateLeaves<T>(parent: T): DelegatedSource<T>;
/**
 * 从数据源创建响应式副本
 * @param source 数据源
 */
export function draft<T>(source: T): DraftData<T>;

export function useViewEffect(fn: () => void): void;
export function useViewEffect(fn: () => () => void): void;
export function useImperativeHandle<T>(
  ref: Ref<T>,
  getter: () => Record<string, any>
): void;
export function useRef<T = any>(): RefObject<T>;
export function createRef<T = any>(): RefObject<T>;
export function createContext<T>(defaultValue?: T): Context<T>;
export function useContext<T>(context: Context<T>): T;
export function batchOperation<T>(source: T, op: (source: T) => void): void
export function isDraft(data: any): boolean

// TODO:
export const createComputed: any;
export const destroyComputed: any;
export const startScope: any;
export const unsafeComputeScope: any;
export const replace: any;
export const findIndepsFromDep: any;
export const findDepsFromIndep: any;
export const spreadUnchangedInScope: any;
export const getComputation: any;
export const collectComputed: any;
export const cachedComputations: any;
export const observeComputation: any;
export const getIndepTree: any;
export const observeTrigger: any;
export const getDisplayName: any;
export const setDisplayName: any;
export const collectReactive: any;
export const autorun: any;

export const StyleEnum: any;
export const StyleRule: any;
export const createFlatChildrenProxy: any;
export const isComponentVnode: any;
export const createSmartProp: any;
export const overwrite: any;
export const disableDraft: any;
export const invariant: any;
export const tryToRaw: any;
export const shallowEqual: any;
export const createBufferedRef: any;
export const deferred: any;
export const Scenario: any;
export const createRange: any;
export const matrixMatch: any;
export const getDisplayValue: any;
