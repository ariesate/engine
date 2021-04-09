/* @jsx createElement */
import { createElement,
  ref,
  refComputed,
  propTypes,
  draft,
  computed,
  getDisplayValue
} from 'axii'

import { Button } from 'axii-components'

/**
 * 1. 当个组件的 vnode 更新和 data
 * 2. 传入的 data 更新的时候组件也要更新。
 * 3. render props 要能正确更新
 *
 */
export default function Todo({ item, draftValue, editing, onDraftValueChange, onDelete, onSetEditing, onChangeComplete, onEditComplete }) {

  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      onEditComplete()
    }
  }

  const completed = refComputed(() => item.type === 'completed')

  return <todo block block-display-flex flex-justify-content-space-between block-width-500px>
    <info>
      {() => editing.value ? null : <input type="checkbox" checked={completed} onChange={onChangeComplete}/>}
      {() => editing.value ? <input value={getDisplayValue(draftValue)} onInput={onDraftValueChange} onKeyDown={onKeyDown} /> : <span>{item.content}</span>}
    </info>
    <operations>
      {() => editing.value ? null : <Button onClick={onSetEditing}>edit</Button>}
      {() => editing.value ? null : <Button danger onClick={() => onDelete()}>delete</Button>}
    </operations>
    </todo>
}

Todo.propTypes = {
  onDelete: propTypes.callback.default(() => () => {}),
  onSetEditing: propTypes.callback.default(() => ({ editing }) => {
    editing.value = true
  }),
  onChangeComplete: propTypes.callback.default(() => ({ item }) => {
    item.type = item.type === 'completed' ? 'uncompleted' : 'completed'
  }),
  item: propTypes.object,
  draftValue: propTypes.string.default(({ item }) => {
    return draft(computed(() => item.content ))
  }),
  onDraftValueChange: propTypes.callback.default(() => ({ draftValue }, props, e) => {
    return draftValue.value = e.target.value
  }),
  onEditComplete: propTypes.callback.default(() => ({ item, draftValue, editing }) => {
    item.content = draftValue.value
    editing.value = false
  }),
  editing: propTypes.bool.default(() => ref(false))
}