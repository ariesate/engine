/** @jsx createElement */
import { createElement, ref, computed, reactive, createComponent } from 'axii'

export const text = `
## event callback & controlled/uncontrolled

用户可以给组件传入函数 property，如果函数作为 event callback 挂在到事件上，那么调用时 AXII 会如果 event 作为参数。
如果该函数 property 在 propType 中声明为 propTypes.callback。那么 AXII 会其增强一下功能：
 
 - 自动为 event callback 补充 3 个参数。
  - draftProps: 用户可以直接修改。
  - props: 原始的 props，不能修改。
  - event。
 - 通过 return false 阻止默认 callback 对数据的修改。
 - 通过 overwrite 标记来完全控制组件的行为。


根据传入数据 property 的不同，组件对数据的操作会不同，最终引起组件行为的不同：
 - 传入 reactive data：组件会使用 propTypes 定义的 default event callback 进行修改。
 - 传入原始数据：不会进行修改。
 - 不传入：组件会使用 propTypes 上定义的 default 数据自行构造。
`

export function Code() {


  return createComponent()
}

