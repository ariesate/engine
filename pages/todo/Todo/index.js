import React from 'react'
import PropTypes from 'prop-types'
import Todo from './Todo'

export const getDefaultState = () => ({
  completed: false,
  text: 'todo',
})

export const stateTypes = {
  completed: PropTypes.bool,
  text: PropTypes.string,
}

export const defaultListeners = {
  onTodoClick({ state }) {
    return {
      ...state,
    }
  },
}

export function render({ state, listeners }) {
  return (
    <Todo
      onTodoClick={listeners.onTodoClick}
      completed={state.completed}
      text={state.text}
    />
  )
}
