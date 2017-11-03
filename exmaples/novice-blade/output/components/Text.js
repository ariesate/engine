import { createElement } from 'novice'

export function getDefaultState() {
  return {
    style: {},
    text: '',
  }
}

export function render({ state }) {
  const style = {
    ...state.style,
  }
  return <div style={style}>{state.text}</div>
}
