/** @jsx createElement */
import { createElement, render, useRef } from 'axii'
import Spreadsheet from 'axii-components/spreadsheet'

function App() {
	const editor = useRef()
	const save = () => {
		console.log(editor.current.getData())
	}

	return (
		<div>
			<button onClick={save}>保存</button>
			<Spreadsheet ref={editor}/>
		</div>
	)
}


render(<App />, document.getElementById('root'))
