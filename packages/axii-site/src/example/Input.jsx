/** @jsx createElement */
import { createElement, ref, propTypes } from 'axii'

export default function Input({ value, onChange}) {
  return <input value={value} onInput={onChange}/>
}

Input.propTypes = {
  value: propTypes.string.default(() => ref('')),
  onChange: propTypes.callback.default(() => ({value}, props, e) => {
    value.value = e.target.value
  })
}
