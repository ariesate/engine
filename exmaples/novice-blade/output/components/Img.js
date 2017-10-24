import { createElement } from 'novice'

export default {
  getDefaultState() {
    return {
      src: '',
    }
  },

  render({ state }) {
    if (state.url === '') return null
    return <image src={state.src} />
  },
}
