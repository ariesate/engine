import React, { Children } from 'react'
import PropTypes from 'prop-types'
import Scope from '@cicada/render/lib/components/Scope'

/*
 props
 */
export const getDefaultState = () => ({
  items: [],
  inline: false,
})

export const stateTypes = {
  items: PropTypes.array,
  inline: PropTypes.bool,
}

/*
 render
 */
export function render({ state, children }) {
  const style = {
    display: state.inline ? 'inline-block' : 'block',
  }

  return (
    <div className="repeat-wrapper">
      {state.items.map((item, index) => (
        <Scope relativeChildStatePath={`items.${index}`} key={item.key}>
          <div className="repeat-item" style={style}>
            {Children.map(children, child => React.cloneElement(child, {}))}
          </div>
        </Scope>
      ))}
    </div>
  )
}
