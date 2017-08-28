import { default as React } from 'react'
import PropTypes from 'prop-types'
import { Input } from 'antd'
import { pick, id, zip, compose } from '../util'
import { Children } from '@cicada/render/lib/lego'
import {
  noop,
  keep,
  createFormItem,
  SIZES,
  COMMON_INPUT_EVENT,
  COMMON_FORM_ITEM_STATE_TYPES,
  createFormItemDefaultState,
} from '../common'
import { Interface } from '@cicada/render/lib/background/utility/form'


const Search = Input.Search

export const implement = [Interface.item]

/*
 props
 */
export const getDefaultState = () => ({
  ...createFormItemDefaultState(),
  value: '',
  placeholder: '',
  size: SIZES[0],
  disabled: false,
  readOnly: false,
  search: false,
})

export const stateTypes = {
  ...COMMON_FORM_ITEM_STATE_TYPES,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.oneOf(SIZES),
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  search: PropTypes.bool,
}

/*
 reduce functions
 */
export const defaultListeners = {
  ...zip(COMMON_INPUT_EVENT, new Array(COMMON_INPUT_EVENT.length).fill(keep)),
  onChange({ state }, e) {
    return {
      ...state,
      value: e.target.value,
    }
  },
  onPressEnter: keep,
  onSearch: keep,
}


/*
 identifier
 */
export const identifiers = {
  Prefix: id(noop),
  Suffix: id(noop),
}

/*
 render
 */
export function render({ state, listeners, children }) {
  const prefix = compose(Children.find, Children.hasChildren)(children, identifiers.Prefix) ? (
    Children.findChildren(children, identifiers.Prefix)[0]
  ) : null

  const suffix = compose(Children.find, Children.hasChildren)(children, identifiers.Suffix) ? (
    Children.findChildren(children, identifiers.Suffix)[0]
  ) : null

  const inputProps = pick(state, ['value', 'disabled', 'size', 'placeholder', 'readOnly'])
  const Component = state.search === true ? Search : Input

  const style = {
    width: '100%',
  }

  return createFormItem(
    state,
    <Component style={style} {...inputProps} addonBefore={prefix} addonAfter={suffix} {...listeners} />,
  )
}
