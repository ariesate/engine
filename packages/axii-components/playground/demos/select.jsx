/** @jsx createElement */
import { createElement, render, reactive, atom } from 'axii'
import { Select } from 'axii-components'

function App() {
  const options = reactive([{
    id: 1,
    name: 'john'
  }, {
    id: 2,
    name: 'jim'
  }, {
    id: 3,
    name: 'johnathon'
  }, {
    id: 4,
    name: 'jody'
  }, {
    id: 5,
    name: 'judy'
  }])

  const value = atom()

  const inputValue = atom({name: ''})

  return <div>
    <h3>Normal Select</h3>
    <Select value={value} options={options}/>
    <div>{ () => `selected: ${value.value ? value.value.name : 'none'}`}</div>
    <hr/>

    <h3>Recommend Mode</h3>
    <Select value={inputValue} allOptions={options} recommendMode/>
    <div>{ () => `selected: ${inputValue.value?.name}; id: ${inputValue.value?.id}`}</div>
  </div>
}

render(<App />, document.getElementById('root'))
