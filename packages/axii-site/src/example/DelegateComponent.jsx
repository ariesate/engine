/** @jsx createElement */
import { createElement, atom } from 'axii'
import Input from './Input.jsx'

export default function InputDemo() {
  const value = atom('')
  return (
    <container>
      <Input value={value}/>
      <div>{() => `value: ${value.value}`}</div>
    </container>
  )

}

