/** @jsx createElement */
import { createElement, render, atom, layoutManager } from 'axii'
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

layoutManager.configAlias({
  'text-xs': 	{ 'font-size': '0.75rem' }
})

render(<div>
  <div block flex flex-wrap text-xs>
    <Input>{slots}</Input>
  </div>
  <div style={{ marginTop: 8 }}>
    <Input>{slot}</Input>
  </div>
</div>, document.getElementById('root'));
