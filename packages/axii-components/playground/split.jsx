/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Split from '../src/split/Split.jsx'


render(<Split >
  <div block block-height-500px>aaaaaaa</div>
  <div>bbbbbbb</div>
</Split>, document.getElementById('root'))
