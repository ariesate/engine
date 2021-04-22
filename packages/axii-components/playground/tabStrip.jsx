/**@jsx createElement*/
import { createElement, render, reactive } from 'axii'
import TabStrip from '../src/tabStrip/TabStrip.jsx'

const items = reactive([
  { key: '1', value: 'item 1'},
  { key: '2', value: 'item 2'},
  { key: '3', value: 'item 3'}
])

render(<TabStrip items={items} closable addable/>, document.getElementById('root'))


function a() {
  console.log("a start")

  function b() {
    Promise.resolve().then(() => {
      console.log("b resolved===")

      Promise.resolve().then(() => {
        console.log("inside b resolved===")
      })
      console.log("b resolve end")
    })
  }

  b()

  console.log("a end")
}
a()
console.log("a outside")
