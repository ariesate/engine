/** @jsx createElement */
import { createElement, createComponent, ref, propTypes } from 'axii'

function Input({ value, onChange}) {
  return <input value={value} onInput={onChange}/>
}

Input.propTypes = {
  value: propTypes.string.default(() => ref('')),
  onChange: propTypes.callback.default(() => ({value}, props, e) => {
    value.value = e.target.value
  })
}

function InputStyle(fragments) {
  fragments.root.elements.input.onFocus((e, {onFocus}) => {
    onFocus()
  })
  fragments.root.elements.input.onBlur((e, {onBlur}) => {
    onBlur()
  })
  fragments.root.elements.input.style(({focused}) => {
    return {
      borderStyle: 'solid',
      borderWidth: 1,
      outline: 'none',
      borderColor: focused.value ? 'blue': 'black'
    }
  })
}

InputStyle.propTypes = {
  focused: propTypes.string.default(() => ref(false)),
  onFocus: propTypes.callback.default(() => ({focused}) => focused.value = true),
  onBlur: propTypes.callback.default(() => ({focused}) => focused.value = false),
}

export const InputWithStyle = createComponent(Input, [InputStyle])

export default function InputDemo() {
  return <InputWithStyle />
}

