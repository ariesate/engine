import { createElement } from 'novice'

export default {
  getDefaultState() {
    return {
      style: {},
      src: '',
    }
  },

  render({ state }) {
    if (state.url === '') return null
    return <image style={state.style} src={state.src} />
  },
}
