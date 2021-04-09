/** @jsx createElement */
import { createElement, ref } from 'axii'
import Input from './Input.jsx'

export default function InputDemo() {
  const value = ref('')
  return (
    <container>
      <Input value={value}/>
      <div>{() => `value: ${value.value}`}</div>
    </container>
  )

}

