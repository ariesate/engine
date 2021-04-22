/** @jsx createElement */
import { createElement, render, reactive, atom } from 'axii'
import OptionTree from '../src/optionTree/OptionTree.jsx'

const options = reactive([{
	id: '1',
	name: 'test1-long',
	children: [{
		id: '2',
		name: 'son1',
	}, {
		id: '3',
		name: 'son2',
		children: [{
			id: '4',
			name: 'son1',
		}, {
			id: '5',
			name: 'son2',
		}]
	}]
}, {
	id: '6',
	name: 'test2',
	children: [{
		id: '7',
		name: 'son1',
	}, {
		id: '8',
		name: 'son2',
	}]
}])

const value = atom()

function App() {
	return <div>
		<OptionTree value={value} options={options}/>
		{/*<div>{ () => `selected: ${value.value ? value.value.name : 'none'}`}</div>*/}
	</div>
}

render(<App />, document.getElementById('root'))
