import { createElement, ref, createComponent, propTypes } from 'axii'

function Component() {
  return <input />
}

Component.Style = (fragments) => {
  const rootElements = fragments.root.elements
  rootElements.input.style(({focused}) => {
    return {
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: focused.value ? 'black': 'blue'
    }
  })
}

Component.Style.propTypes = {
  focused: propTypes.bool.default(() => ref(false)),
  onFocus: propTypes.callback.default(() => ({focused}) => focused.value = true),
  onBlur: propTypes.callback.default(() => ({focused}) => focused.value = false)
}

export default createComponent(Component)
