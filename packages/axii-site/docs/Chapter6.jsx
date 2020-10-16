/** @jsx createElement */
import { createElement, ref, computed, reactive, createComponent } from 'axii'

export const text = `
## listener callback & controlled

这些阻止行为背后的本质？？？？要复用原本的逻辑。
可以用过一个总的 overwrite() 来标记，标记后，会把原来的 fn 作为第一参数传入。

- 阻止默认事件
 - 开始前阻止
 - 之后阻止
- 阻止数据被修改
- 改写数据


`

export function Code() {


  return createComponent()
}

