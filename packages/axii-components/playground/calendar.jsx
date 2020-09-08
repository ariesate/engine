/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Calendar from '../src/calendar/Calendar.jsx'

render(<div>
  <Calendar />
</div>, document.getElementById('root'))
