import React from 'areact'
import classNames from 'classnames'
import { ALL_TODOS, ACTIVE_TODOS, COMPLETED_TODOS } from './constant';

export default function TodoFooter({count, onChange, nowShowing, onClearCompleted, completedCount}) {
  const activeTodoWord = `${count} item${count === 1 ? '' : 's'}`;
  let clearButton = null;

  if (completedCount > 0) {
    clearButton = (
      <button
        className="clear-completed"
        onClick={onClearCompleted}>
        Clear completed
      </button>
    );
  }

  return (
    <footer className="footer">
					<span className="todo-count">
						<strong>{count}</strong> {activeTodoWord} left
					</span>
      <ul className="filters">
        <li>
          <a
            href="#/"
            onClick={() => onChange(ALL_TODOS)}
            className={classNames({selected: nowShowing === ALL_TODOS})}>
            All
          </a>
        </li>
        {' '}
        <li>
          <a
            href="#/active"
            onClick={() => onChange(ACTIVE_TODOS)}
            className={classNames({selected: nowShowing === ACTIVE_TODOS})}>
            Active
          </a>
        </li>
        {' '}
        <li>
          <a
            href="#/completed"
            onClick={() => onChange(COMPLETED_TODOS)}
            className={classNames({selected: nowShowing === COMPLETED_TODOS})}>
            Completed
          </a>
        </li>
      </ul>
      {clearButton}
    </footer>
  );
}
