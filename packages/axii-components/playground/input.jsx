/** @jsx createElement */
import { createElement, render, atom } from 'axii'
import Input from '../src/input/Input.jsx'

const refPrefix = atom('prefix')

const slots = {
  prefix() {
    return refPrefix
  },
  before: atom('test'),
  suffix: atom('suffix')
}

setTimeout(() => {
  slots.before.value = undefined
  // refPrefix.value = 'prefix1'
}, 1000)
//
render(<Input>{slots}</Input>, document.getElementById('root'))
