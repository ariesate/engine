import { default as React, PropTypes, Children } from 'react'
import Scope from '@cicada/render/lib/components/Scope'

/*
 props
 */
export const defaultState = {
  items: [],
  inline: false,
}

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
      {state.items.map((_, index) => (
        <Scope relativeChildStatePath={`items.${index}`} key={index}>
          <div className="repeat-item" style={style}>
            {Children.map(children, child => React.cloneElement(child, {}))}
          </div>
        </Scope>
      ))}
    </div>
  )
}
