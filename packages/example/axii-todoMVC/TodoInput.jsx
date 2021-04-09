/* @jsx createElement */
import { createElement, ref, propTypes } from 'axii'

// 参数声明就是 state
export default function Input({ content, onAddSubmit, onTextChange }) {
  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      onAddSubmit()
    }
  }


  return (
    <div>
      <input value={content} onInput={onTextChange} onKeyDown={onKeyDown}/>
    </div>
  )
}

Input.propTypes = {
  onAddSubmit: propTypes.callback.default(() => (draftProps ) => {
      // 这是内部组件要做的事。
    draftProps.content.value = ''
  }),
  onTextChange: propTypes.callback.default(() => (draftProps, props, e) => {
    draftProps.content.value = e.target.value
  }),
  content: propTypes.string.default(() => ref('draft')),
}