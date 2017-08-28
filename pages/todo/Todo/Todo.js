import React from 'react'
import PropTypes from 'prop-types'

const Todo = ({ onTodoClick, completed, text }) => (
  <div
    onClick={onTodoClick}
    style={{
      textDecoration: completed ? 'line-through' : 'none',
    }}
  >
    {text}
  </div>
)

Todo.propTypes = {
  onTodoClick: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
}

export default Todo
