/** @jsx createElement */
import { createElement, render, computed } from 'axii'
import { createHashHistory } from 'history';
import Table from '../src/table/Table'
import useRequest from "../src/hooks/useRequest";

function App() {
	const {data, loading} = useRequest({
		url: 'https://api.apiopen.top/getWangYiNews',
	}, {
		processData: {
			receive(data, responseData) {
				data.value = responseData
			}
		}
	})

	const { error, loading: errorLoading } = useRequest('http://error')

	const columns = [{
		title: '标题',
		dataIndex: 'title',
	}, {
		title: '事件',
		dataIndex : 'passtime'
	}]

	return (
		<div>
			<div>{() => loading.value ? 'loading': 'load complete'}</div>
			<Table
				columns={columns}
				data={computed(() => {
					console.log(data)
					return (data.value? data.value.result : [])
				})}
			/>
			<div>{ () => errorLoading.value ? 'error example loading' : 'error completed'} </div>
			<div>{() => `error: ${JSON.stringify(error.value)}`}</div>
		</div>
	)
}


render(<App />, document.getElementById('root'))
