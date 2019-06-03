import { createElement } from 'novice'

export default {
  getDefaultState() {
    return {
      content: '',
    }
  },
  listeners: {
    onChange({ state }, e) {
      state.content = e.target.value
    },
  },
  render({ state, listeners }) {
    return (
      <header className="header">
        <h1>todos</h1>
        <input className="new-todo" value={state.content} onKeyUp={listeners.onChange} />
      </header>
    )
  },
}
