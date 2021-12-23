/** @jsx createElement */
import { createElement, render, useRef } from 'axii'
import { Spreadsheet, Button } from 'axii-components'

function App() {
	const editor = useRef()
	const save = () => {
		console.log(editor.current.getData())
	}

	return (
		<div>
			<Button primary onClick={save}>保存</Button>
			<Spreadsheet ref={editor}/>
		</div>
	)
}


render(<App />, document.getElementById('root'))
