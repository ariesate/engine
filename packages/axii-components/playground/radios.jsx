/** @jsx createElement */
import { createElement, render, ref, createComponent } from 'axii'
import Radios from '../src/radios/Radios.jsx'

function App() {

	const value = ref('red')
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
