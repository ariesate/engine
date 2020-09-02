/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Icon from '../src/icon/Icon.jsx'

function App() {
  return <div>
    <Icon type="alert" color="#090"/>
    <Icon type="playCircle" size={50} color="#951324"/>
  </div>
}

render(<App></App>, document.getElementById('root'))
