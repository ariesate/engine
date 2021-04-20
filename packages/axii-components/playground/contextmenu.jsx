/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import contextmenu from '../src/contextmenu/contextmenu.jsx'

function App() {
	const openContextmenu = (e) => {
		e.preventDefault()
		contextmenu.open(<div>
			this is context menu
		</div>, {left: e.pageX, top: e.pageY})
	}

	return (
		<div onContextmenu={openContextmenu}>
			Right click to open contextmenu
		</div>
	)
}


render(<App />, document.getElementById('root'))
