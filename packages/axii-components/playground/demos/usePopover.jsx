/** @jsx createElement */
import { createElement, render } from 'axii'
import { usePopover, Menu, Button } from 'axii-components'

function App() {

	const data = [{
		title: 'menu 1',
		key: 'menu 1',
		children: [{
			title: 'sub 1',
			key: 'sub 1',
		}]
	}, {
		title: 'menu 2',
		key: 'menu 2'
	}]
	const { visible, node, source} = usePopover(<Menu data={data} />)

	return (
		<div>
			<Button ref={source} onClick={() => visible.value = !visible.value}>open/close popover</Button>
			{node}
		</div>
	)
}

render(<App />, document.getElementById('root'))
