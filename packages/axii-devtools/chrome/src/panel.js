import { createElement, render, ref } from 'axii'
import App from './App'
/*****************
 * 调用 AXII_HELPERS
 *****************/
function execute(scriptFn, callback = () => {}) {
	chrome.devtools.inspectedWindow.eval(`(${scriptFn.toString()})()`, callback)
}

function scriptFlashCurrentIndepTree() {
	return window.AXII_HELPERS.flashCurrentIndepTree();
}

function scriptObserve() {
	return window.AXII_HELPERS.observe();
}

function scriptUnobserve() {
	return window.AXII_HELPERS.unobserve();
}

const getCurrentIndepTree = (callback) => execute(scriptFlashCurrentIndepTree, callback)

const observe = (callback) => execute(scriptObserve, callback)
const unobserve = (callback) => execute(scriptUnobserve, callback)

/*****************
 * panel 的入口
 *****************/
document.addEventListener('DOMContentLoaded', function () {

	const indepTree = ref(null)
	const checkInterval = 200

	function startRepaintCheckInterval () {
		let nextCheckTask = null

		const repaintCheck = () => {
			getCurrentIndepTree((indeps, exception) => {
				if (exception) {
					console.error(exception)
					return
				}

				// 如果不是 null，说明有了新的。
				if (indeps) {
					indepTree.value = indeps
				}

				// 又创建一个新的任务
				nextCheckTask = setTimeout(() => {
					repaintCheck()
				}, checkInterval)
			})
		}

		observe((result, exception) => {
			if (exception) {
				console.error(exception)
			} else {
				repaintCheck()
			}
		})

		return () => {
			nextCheckTask && clearTimeout(nextCheckTask)
			unobserve()
		}
	}

	startRepaintCheckInterval()

	// TODO inspect 回调和执行
	render(<App indepTree={indepTree}/>, document.getElementById('root'))
})


