import { default as React } from 'react'
import PropTypes from 'prop-types'

import { Checkbox } from 'antd'
import { omit } from '../util'

/*
 state
 */
export const getDefaultState = () => ({
  text: '',
  disabled: false,
  checked: false,
  indeterminate: false,
})

export const stateTypes = {
  text: PropTypes.string,
  disabled: PropTypes.bool,
  checked: PropTypes.bool,
  indeterminate: PropTypes.bool,
}

/*
 reduce functions
 */
export const defaultListeners = {
  onChange({ state }, e) {
    return {
      ...state,
      checked: e.target.checked,
    }
  },
}

/*
 render
 */
export function render({ state, listeners }) {
  return <Checkbox {...omit(state, 'text')} {...listeners}>{state.text}</Checkbox>
}
