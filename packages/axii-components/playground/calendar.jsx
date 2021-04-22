/** @jsx createElement */
import { createElement, render} from 'axii'
import Calendar from '../src/calendar/Calendar.jsx'

render(
  <div>
    <Calendar />
  </div>,
  document.getElementById('root')
)
