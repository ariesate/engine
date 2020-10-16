/** @jsx createElement */
import { createElement, ref, computed, reactive, createComponent } from 'axii'

export const text = `
## 非 layout 样式

非 layout 样式指的是和结构无关的样式，例如 color/font-family 等。
非 layout 样式是利用 createComponent 提供的 feature 能力实现的。

feature 可以声明自己的 propType，监听事件。
`

export function Code() {
  function Component() {
    return <input />
  }

  Component.Style = (fragments) => {
    const rootElements = fragments.root.elements
    rootElements.input.style(({focused}) => {
      return {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: focused.value ? 'black': 'blue'
      }
    })
  }

  Component.Style.propTypes = {
    focused: propTypes.bool.default(() => ref(false)),
    onFocus: propTypes.callback.default(() => ({focused}) => focused.value = true),
    onBlur: propTypes.callback.default(() => ({focused}) => focused.value = false)
  }

  return createComponent(Component)
}

