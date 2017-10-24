import { createElement } from 'novice'

export default {
  getDefaultState() {
    return {
      style: {},
      url: '#',
    }
  },

  render({ state, children }) {
    return <a style={state.style} href={state.url}>{children}</a>
  },
}
