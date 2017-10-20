import { createElement } from 'novice'
import classnames from "classnames"

export const FILTER_ALL = 'all'
export const FILTER_COMPLETED = 'completed'
export const FILTER_ACTIVE = 'active'

export default {
  getDefaultState() {
    return {
      type: 'all',
      count: 0,
      selected: FILTER_ALL,
    }
  },
  listeners: {
    onChange({ state }, filter) {
      state.selected = filter
    },
  },
  render({ state, listeners }) {
    const itemWord = state.count === 1 ? 'item' : 'items'

    return (
      <footer className="footer">
        <span className="todo-count">
          <strong>{state.count || 'No'}</strong> {itemWord} left
        </span>
        <ul className="filters">
          {[FILTER_ALL, FILTER_ACTIVE, FILTER_COMPLETED].map(filter => (
            <li key={filter}>
              <a
                className={classnames({ selected: filter === state.selected })}
                style={{ cursor: 'pointer' }}
                onClick={() => listeners.onChange(filter)}
              >
                {filter}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    )
  },
}
