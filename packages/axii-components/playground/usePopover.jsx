/** @jsx createElement */
import { createElement, render, reactive, atomComputed, ref } from 'axii'
import usePopover from '../src/hooks/usePopover.jsx'
import Menu from "../src/menu/Menu";

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
			<button ref={source} onClick={() => visible.value = !visible.value}>打开/关闭 popover</button>
			{node}
		</div>
	)
}

render(<App />, document.getElementById('root'))
