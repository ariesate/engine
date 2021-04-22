/** @jsx createElement */
import { createElement, render, reactive, atom } from 'axii'
import Select from '../src/select/Select.jsx'

const options = reactive([{
  id: 1,
  name: 'john'
}, {
  id: 2,
  name: 'jim'
}])

const value = atom()

function App() {
  return <div>
    <Select value={value} options={options}/>
    <div>{ () => `selected: ${value.value ? value.value.name : 'none'}`}</div>
  </div>
}

render(<App />, document.getElementById('root'))
