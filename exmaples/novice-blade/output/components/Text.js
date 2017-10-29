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
  console.log(">>>> text style", JSON.stringify(state.style), state.text)
  return <div style={style}>{state.text}</div>
}
