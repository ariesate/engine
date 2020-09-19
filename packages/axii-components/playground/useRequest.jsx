/** @jsx createElement */
import { createElement, render, computed } from 'axii'
import { createHashHistory } from 'history';
import Table from '../src/table/Table'
import useRequest from "../src/hooks/useRequest";

function App() {
	const {data, loading, error, run} = useRequest('https://api.apiopen.top/getWangYiNews')

	const columns = [{
		title: '标题',
		dataIndex: 'title',
	}, {
		title: '事件',
		dataIndex : 'passtime'
	}]

	// TODO 单独更新 string 节点有问题？？？string 接在 string 后面就有问题！！！一个完整的没问题。
	return (
		<div>
			<div>{() => loading.value ? 'loading': 'load complete'}</div>
			<Table
				columns={columns}
				data={computed(() => (data.value? data.value.result : []))}
			/>
		</div>
	)
}


render(<App />, document.getElementById('root'))
