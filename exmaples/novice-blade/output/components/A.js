import { createElement } from 'novice'

export default {
  getDefaultState() {
    return {
      style: {},
      url: '#',
    }
  },

  render({ state, children }) {
    const toDisplay = state.text ? state.text : children
    const style = {
      ...state.style,
      cursor: 'pointer',
    }
    return <div style={style} onClick={() => window.location.href = state.url}>{toDisplay}</div>
  },
}
