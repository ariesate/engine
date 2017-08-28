import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'antd'
import { omit } from '../util'
import { keep, SIZES } from '../common'

const TYPES = ['normal', 'primary', 'dashed', 'ghost']
/*
 props
 */
export const getDefaultState = () => ({
  text: '',
  size: SIZES[0],
  loading: false,
  type: TYPES[0],
  disabled: false,
  icon: '',
})

export const stateTypes = {
  text: PropTypes.string,
  size: PropTypes.oneOf(SIZES),
  loading: PropTypes.bool,
  type: PropTypes.oneOf(TYPES),
  disabled: PropTypes.bool,
  icon: PropTypes.string,
}

/*
 reduce functions
 */
export const defaultListeners = {
  onClick: keep,
}

/*
 render
 */
export function render({ state, listeners }) {
  return <Button {...omit(state, 'text')} {...listeners}>{state.text}</Button>
}
