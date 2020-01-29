/**
 *
 * 先讨论模式有没有问题再讨论实现把！！！！
 * computed 有 ajax 的怎么办？？？data reactive 不好办啊
 *
 * data reactive 的核心问题在于，除了事件以外，其他的数据都要保持一致。
 * 如果在 data 中还能 watch 的话，就可能会出现没有事件语意的情况。
 *
 */


/**
 *  需求：
 * 1 . reactive 的 computed 数据能正常跑 ！
 *  容易。做简单的依赖收集即可。
 *
 * ===========
 * 2. 确保 jsx 中的所有用法，都能将节点内容和当前的 vnode 关联起来
 *  1. 正常的 reactive variable !
 *  2. map/entries/keys
 *     复写 reactive 对象的这些函数
 *  3. 字符串拼接的 expressionStatement/数字计算 ？
 *    operator 形式的 expression 可以考虑 overloading
 *    既然模板中能用，那么是不是整个程序中也能用？
 *    overloading 性能损耗大。
 *  4. Array.from.map 等有返回值的函数又计算了一遍
 *    ？？？无解
 *
 * ===========

 * 3. from/to(derived) 的写法能成功。生成的 state 虽然是 computed，但也要能修改。
 *  容易。关键是要通过系统概念保持了数据的一致性。
 */

/**
 * 现在的关键问题就是"能否做到 expression 识别出来"。
 * 以一种什么样的天才方式识别出来。
 *
 * 1. overloading 以后会有。也算是一种标准了。情况不乐观啊。
 * 2. 限制只能写 c(()=> xxx) 这样的表达式？能不能自动转换？写起来有点麻烦，修改 jsx plugin 的语法？
 * 这种情况下 overload 也不需要了。就是有点奇怪，为什么 jsx 中是可以，正常语句中就不行。用户会不会搞混。
 *
 * 3. 又发明一种特殊的语法，让 reactive 的部分写起来更容易，但是就不符合 js 本来的用法了。比如以 $开头的变量自动 reactive。
 *   这种情况下 computed 的写法会不会很奇怪？
 *
 * 变量 $ 开头，就自动 reactive
 * < $ > 存在，其中就自动 reactive。
 */
import { isReactive, isRef, toRaw as internalToRaw } from './reactive'

import { invariant } from '../util';
import { isRef as internalIsRef } from './reactive'
export { reactive, ref, isRef, isReactive } from './reactive'
export {
  refComputed,
  objectComputed,
  arrayComputed,
  createComputed,
  destroyComputed,
  startScope,
  unsafeComputeScope,
  replace,
  findIndepsFromDep,
  findDepsFromIndep,
  spreadUnchangedInScope,
} from './effect'

export function isReactiveLike(obj) {
  return isReactive(obj) || isRef(obj)
}

export function toRaw(obj) {
  if (isReactive(obj)) return internalToRaw(obj)
  if (isRef(obj)) return { value: obj.value }
  invariant(false, 'obj is not reactiveLike')
}

