import { createElement, ref, createComponent, propTypes } from 'axii'

function Component({ onFocus, onBlur}) {
  return <container>
    <line block>
      <box use="input" onFocus={onFocus} onBlur={onBlur}/>
    </line>
    <line block>
      <textLink use="a" href="#">a link</textLink>
    </line>
  </container>
}

Component.Style = (fragments) => {
  fragments.root.elements.box.style(({focused}) => {
    return {
      borderStyle: 'solid',
      borderWidth: 1,
      outline: 'none',
      borderColor: focused.value ? 'blue': 'black'
    }
  })

  fragments.root.elements.textLink.match.hover.style({
    color: 'green'
  })
}

Component.Style.propTypes = {
  focused: propTypes.bool.default(() => ref(false)),
  onFocus: propTypes.callback.default(() => ({focused}) => focused.value = true),
  onBlur: propTypes.callback.default(() => ({focused}) => focused.value = false)
}

export default createComponent(Component)
