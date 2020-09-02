import { createElement, render, reactive, ref } from 'axii'
import Input from './input/Input.jsx'
import 'normalize.css'

const refPrefix = ref('prefix')

const slots = {
  prefix() {
    return refPrefix
  },
  before: ref('test'),
  suffix: ref('suffix')
}

setTimeout(() => {
  slots.before.value = undefined
  // refPrefix.value = 'prefix1'
}, 1000)
//
render(<Input>{slots}</Input>, document.getElementById('root'))
