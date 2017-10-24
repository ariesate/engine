import { createElement, cloneElement } from 'novice'

function renderSelector(names, onChange, ref) {
  const style = {
    position: 'absolute',
    top: ref.clientTop + 20,
    left: ref.clientLeft,
  }

  return (
    <div style={style}>{names.map(name => <span onClick={() => onChange(name)}>{name}</span>)}</div>
  )
}

export default {
  getDefaultState() {
    return {
      current: null,
      showSelector: false,
    }
  },

  listeners: {
    onChange({ state }, name) {
      state.current = name
      state.showSelector = false
    },
  },

  onGlobalKeyboard({ state }, type, e) {
    if (e.keyCode === 91) {
      state.showSelector = type === 'keydown'
    }
  },
  render({ state, children, listeners, refs = {} }) {
    if (children.length === 0) return null
    const current = state.current === null ? children[0].attributes.caseName : state.current
    const currentChild = cloneElement(children.find(child => child.attributes.caseName === current), { ref: 'current' })
    return state.showSelector ? [currentChild, renderSelector(children.map(child => child.attributes.caseName), listeners.onChange, refs.current)] : currentChild
  },
}
