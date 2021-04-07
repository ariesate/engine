/** @jsx createElement */
import { createElement, ref, computed, render } from 'axii'
import Hello from './Hello.mdx'

function Site() {
  return (
    <div>
      <Hello />
      <div>now you are free to go. next, learn most powerful weapon, component utility</div>
    </div>
  )
}

render(<Site />, document.getElementById('root'))
