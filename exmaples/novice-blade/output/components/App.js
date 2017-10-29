import { createElement } from 'novice'

export function getDefaultState() {
  return {
    style: {},
  }
}

export function render({ state, children }) {
  const style = {
    position: 'relative',
    background: state.style.background,
  }

  return <div style={style}>{children}</div>
}
