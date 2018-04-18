import { createElement } from 'novice'

export function getDefaultState() {
  return {
    style: {},
  }
}

export function render({ state, children }) {
  const style = {
    ...state.style,
    position: 'relative',
  }

  return <div style={style}>{children}</div>
}
