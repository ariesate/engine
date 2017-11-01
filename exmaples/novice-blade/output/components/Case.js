import { createElement, cloneElement } from 'novice'

function renderSelector(names, onChange, ref) {
  const style = {
    position: 'absolute',
    top: ref.clientTop + 20,
    left: ref.clientLeft,
    cursor: 'pointer',
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
    // TODO case 切换回去就有问题了
    onChange({ state }, name) {
      if (state.current === name) return

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
    const current = state.current === null ? children[0].props.caseName : state.current
    const currentChild = cloneElement(children.find(child => child.props.caseName === current), { ref: 'current' })
    return state.showSelector ? [currentChild, renderSelector(children.map(child => child.props.caseName), listeners.onChange, refs.current)] : currentChild
  },
}
