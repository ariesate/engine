/** @jsx createElement */
import { createElement, render, reactive, ref, createComponent } from 'axii'
import Menu from '../src/menu/Menu.jsx'

function App(props, fragments) {

	const show = ref(false)
	const data = [1,2]

	return <div>
		<span>
			<button onClick = {() => show.value = !show.value}>toggle</button>
		</span>
		{() => {
			if (!show.value) return null

			return data.map((i) => fragments.item()(<span>{i}</span>))
		}}
	</div>
}

const Fpp =createComponent(App)



render(<Fpp/>, document.getElementById('root'))
