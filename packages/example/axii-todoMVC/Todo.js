import { createElement, render, reactiveExpression, reactive, ref, computed, propTypes } from 'axii'
import { refComputed } from '../../controller-axii/src/reactive';
/**
 * 1. 当个组件的 vnode 更新和 data
 * 2. 传入的 data 更新的时候组件也要更新。
 * 3. render props 要能正确更新
 *
 */
export default function Todo({ item, editing, onUpdateTodo, onDelete, onSetEditing, onChangeComplete }) {
  const onChangeTodo = (e) => {
    onUpdateTodo((props) => {
      props.item.content = e.target.value
    })
  }

  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      onChangeComplete((next) => {
        next.editing.value = false
      })
    }
  }

  const onClickEdit = () => {
    onSetEditing((next) => {
      console.log(next.editing)
      next.editing.value = !next.editing.value
    })
  }

  return <div>
    {refComputed(() => editing.value ? <input value={item.content} onInput={onChangeTodo} onKeyDown={onKeyDown} /> : <span>{item.content}</span>)}
    {refComputed(() => editing.value ? null : <button onClick={onClickEdit}>edit</button>)}
    <button onClick={() => onDelete()}>delete </button>
    </div>
}

Todo.propTypes = {
  onUpdateTodo: propTypes.func,
  onDelete: propTypes.func,
  onSetEditing: propTypes.func,
  onChangeComplete: propTypes.func,
  item: propTypes.object,
  editing: propTypes.bool.default(() => ref(false))
}