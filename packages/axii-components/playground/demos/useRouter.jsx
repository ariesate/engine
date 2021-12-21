/** @jsx createElement */
import { createElement, render } from 'axii'
import { createHashHistory } from 'history';
import { useLocation, useRouter, Menu } from 'axii-components'

const location = useLocation({}, createHashHistory())

function App({ children }) {
	const paths = ['/app/child/1', '/app/xxxx']

	const gotoNext = ({ title }) => {
		location.goto(title)
	}

	return (
		<div>
			<div>App</div>
			<Menu data={paths.map(path=> ({title: path, id: path}))} onSetActive={gotoNext}/>
			<div>children:</div>
			{children}
		</div>
	)
}

function Child({ params }) {

	const ids = [1,2,3,4]
	const gotoNext = ({ title }) => {
		location.goto(`/app/child/${title}`)
	}

	return (
		<div>
			<div>child</div>
			<div>
				<Menu data={ids.map(id=> ({title: id, id}))} onSetActive={gotoNext}/>
			</div>
			<div>params: {() => JSON.stringify(params)}</div>
		</div>
	)
}


function NotFound() {
	return <div>404</div>
}

const app = useRouter([{
	path: '/app',
	component: App,
	routes: [{
		path: '/child/:id',
		component: Child
	}]
}], NotFound, location)

location.goto('/app')

render(<div>
	<div>Do not run this example in iframe, or you may not see location change. </div>
	{app}
</div>, document.getElementById('root'))
