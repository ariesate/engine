/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Checkbox from '../src/checkbox/Checkbox.jsx'

render(<div>
  <Checkbox >test</Checkbox>
  <Checkbox disabled>test</Checkbox>
  <Checkbox value={ref(true)}>test</Checkbox>
</div>, document.getElementById('root'))
