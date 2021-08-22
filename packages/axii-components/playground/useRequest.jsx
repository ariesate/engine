/** @jsx createElement */
import { createElement, render, computed, atom, atomComputed, debounceComputed, autorun } from 'axii'
import axios from 'axios'
import { createHashHistory } from 'history';
import Table from '../src/table/Table'
import Pagination from '../src/pagination/Pagination'
import useRequest from "../src/hooks/useRequest";

function App() {

	const data = atom()
	const limit = atom(10)

	const currentLength = atomComputed(() => {
		return data.value?.result.length || limit.value
	})

	const offset = atom(0)

	const { currentPage, ...pageProps } = Pagination.useInfinitePageHelper(offset, limit, currentLength)

	const {loading} = useRequest(() => {
		console.log("sending request")
		return axios({
			url: `https://api.apiopen.top/getWangYiNews?page=${currentPage.value}&count=${limit.value}`,
		})
	}, {
		data,
		processData: {
			receive(outData, responseData) {
				console.log("receiving....")
				outData.value = responseData
			}
		}
	})

	const onPageChange = (pageIndex) => {
		debounceComputed(() => {
			offset.value = (pageIndex - 1) * limit.value
		})
	}

	const { error, loading: errorLoading } = useRequest('http://error')

	const columns = [{
		title: '标题',
		dataIndex: 'title',
	}, {
		title: '事件',
		dataIndex : 'passtime'
	}]

	const list = computed(() => {
		return (data.value? data.value.result : [])
	})

	return (
		<div>
			<div>{() => loading.value ? 'loading': 'load complete'}</div>
			<Table
				columns={columns}
				data={list}
			/>
			<Pagination currentPage={currentPage} {...pageProps} onChange={onPageChange}/>
			<div>{ () => errorLoading.value ? 'error example loading' : 'error completed'} </div>
			<div>{() => `error: ${JSON.stringify(error.value)}`}</div>
		</div>
	)
}


render(<App />, document.getElementById('root'))
