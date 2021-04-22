/** @jsx createElement */
import { createElement, render, atom, createComponent } from 'axii'
import Radios from '../src/radios/Radios.jsx'

function App() {

	const value = atom('red')
	const options = ['red', 'blue']

	return <div>
		<Radios value={value} options={options} />
		<div>
			{() => `selected: ${value.value}`}
		</div>
	</div>
}

const Fpp =createComponent(App)

render(<Fpp/>, document.getElementById('root'))
