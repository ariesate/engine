/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Checkbox from '../src/checkbox/Checkbox.jsx'

render(<div>
  <div>
    <Checkbox >test</Checkbox>
  </div>
  <div>
    <Checkbox disabled>test2 disabled</Checkbox>
  </div>
  <div>
    <Checkbox value={ref(true)}>test3 with ref value true</Checkbox>
  </div>

</div>, document.getElementById('root'))
