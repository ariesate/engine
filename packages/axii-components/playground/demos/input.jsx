/** @jsx createElement */
import { createElement, render, atom } from 'axii'
import { Input } from 'axii-components'
import HomeStay from 'axii-icons/HomeStay'

const refPrefix = atom('prefix')

const slots = {
  prefix() {
    return refPrefix
  },
  suffix: atom('suffix')
}

const slot = {
  before: <HomeStay />
}

render(<div>
  <div>
    <Input>{slots}</Input>
  </div>
  <div style={{ marginTop: 8 }}>
    <Input>{slot}</Input>
  </div>
</div>, document.getElementById('root'));
