import { createElement, render, reactiveExpression, reactive, ref, computed, propTypes } from 'axii'

// 参数声明就是 state
export default function Input({ content, onAddSubmit, onTextChange }) {
  // 这个是所谓的适配类
  const onChange = (e) => onTextChange((next) => {
    next.content.value = e.target.value
  })

  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      onAddSubmit((next) => {
        // 这是内部组件要做的事。
        next.content.value = ''
      })
    }
  }

  return (
    <div>
      <input value={content} onInput={onChange} onKeyDown={onKeyDown}/>
    </div>
  )
}

Input.propTypes = {
  onAddSubmit: propTypes.func,
  onTextChange: propTypes.func,
  content: propTypes.object.default(() => ref('draft')),
}