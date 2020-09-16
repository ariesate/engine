/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import DatePicker from '../src/datePicker/DatePicker.jsx'

render(<div>
  <DatePicker />
  <div>其他内容，应该被浮层遮住</div>
</div>, document.getElementById('root'))