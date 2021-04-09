/** @jsx createElement */
import { createElement, ref, propTypes } from 'axii'
import Input from './Input.jsx'

export default function ControlledComponent() {
  const value = 'controlled value'
  return <Input value={value}/>
}

