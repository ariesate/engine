import { createElement } from '@ariesate/render'
import classnames from "classnames"

function renderItem(todo, listeners) {
  return (
    <li key={todo.id} className={classnames({
      completed: todo.completed,
    })}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={todo.completed}
          onChange={() => listeners.toggleComplete(todo)}
        />
        <label>{todo.content}</label>
        <button className="destroy" onClick={() => listeners.onRemove(todo)} />
      </div>
    </li>
  )
}

export default {
  getDefaultState() {
    return {
      list: [],
    }
  },
  listeners: {
    onRemove() {},
    toggleComplete() {},
  },
  render({ state, listeners }) {
    console.log("main render")
    return (
      <section className="main">
        <ul className="todo-list">
          {
            state.list.map(todo => renderItem(todo, listeners))
          }
        </ul>
      </section>
    )
  },
}
