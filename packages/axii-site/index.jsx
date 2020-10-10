/** @jsx createElement */
import { createElement, ref, computed, render } from 'axii'
import { Code as Code1 } from './docs/Chapter1.jsx'
import { Code as Code2 } from './docs/Chapter2.jsx'

function Site() {
  return (
    <div>
      <Code1 />
      <Code2 />
      <div>now you are free to go. next, learn most powerful weapon, component utility</div>
    </div>
  )
}

render(<Site />, document.getElementById('root'))
