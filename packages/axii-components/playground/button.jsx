/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Button from '../src/button/Button.jsx'

function App() {
	return (
		<div>
			<Button>normal</Button>
			<Button primary>primary</Button>
			<Button danger>danger</Button>
			<Button primary disabled>primary disabled</Button>
			<Button danger disabled>danger disabled</Button>
		</div>
	)
}


render(<App />, document.getElementById('root'))
