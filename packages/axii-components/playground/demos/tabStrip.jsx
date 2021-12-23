/**@jsx createElement*/
import { createElement, render, reactive } from 'axii'
import { TabStrip } from 'axii-components'

const items = reactive([
  { key: '1', value: 'item 1'},
  { key: '2', value: 'item 2'},
  { key: '3', value: 'item 3'}
])

render(<TabStrip items={items} closable addable/>, document.getElementById('root'))
