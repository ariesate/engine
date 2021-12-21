/** @jsx createElement */
import { createElement, atom, render, debounceComputed } from 'axii'
import { Pagination } from "axii-components";

const { useInfinitePageHelper } = Pagination

function App() {
	return (
		<div>
			<div>
				<div>common pagination</div>
				<Pagination pageCount={atom(20)} />
			</div>
			<div>
				<div>infinite pagination</div>
				<InfinitePagination />
			</div>
		</div>
	)
}

function InfinitePagination() {
	const offset = atom(0)
	const limit = atom(10)
	const currentLength = atom(10)
	const pageProps = useInfinitePageHelper(offset, limit, currentLength)

	const total = atom(73)

	const onPageChange = (pageIndex) => {
		debounceComputed(() => {
			offset.value = (pageIndex - 1) * limit.value
			currentLength.value = Math.min(total.value - offset.value, limit.value)
		})
	}

	return <div>
		<Pagination {...pageProps} onChange={onPageChange}/>
		<button onClick={() => total.value = 80}>patchTotalTo 80</button>
		<button onClick={() => total.value = 91}>patchTotalTo 91</button>
	</div>
}


render(<App />, document.getElementById('root'))

