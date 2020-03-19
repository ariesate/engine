/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Icon from './icon/Icon.js'

function App() {
  return <div>
    <Icon type="alert" color="#090"/>
    <Icon type="playCircle"/>
  </div>
}

render(<App></App>, document.getElementById('root'))
