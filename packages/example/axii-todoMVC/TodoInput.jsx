/* @jsx createElement */
import { createElement, ref, propTypes } from 'axii'
import { Input } from 'axii-components'

export default function TodoInput({ content, onAddSubmit, onTextChange }) {
  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      onAddSubmit()
    }
  }

  return (
    <div>
      <Input value={content} onInput={onTextChange} onKeyDown={onKeyDown}/>
    </div>
  )
}

TodoInput.propTypes = {
  onAddSubmit: propTypes.callback.default(() => (draftProps ) => {
      // 这是内部组件要做的事。
    draftProps.content.value = ''
  }),
  onTextChange: propTypes.callback.default(() => (draftProps, props, e) => {
    draftProps.content.value = e.target.value
  }),
  content: propTypes.string.default(() => ref('draft')),
}