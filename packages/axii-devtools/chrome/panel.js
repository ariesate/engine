/**
 * window.AXII_HELPERS 需要准备好:
 * getComputation:
 * 1. 用来注入 $debug
 * 2. 拿到 indeps，然后又可用 indeps 递归拿到 indeps 的 computation。一直递归到 source。
 *
 */

/**
 * 每个页面的 devtools 都是独立的，所以会有多个 panel。但整个 extension 的 background 只有一个，它是消息转发中心。
 * panel 在初始化时要连接到 background，并触发 init 事件，将自己的 tabId 传过去，这样对应的 content script 消息才能转发过来。
 */

// 注入页面 AXII 和 content script 的通信机制
function setupHooks() {
	if (window.AXII_HELPERS.injected) return
	// 发消息 content script，content script 会原封不动转给 background. background 再装给当前 panel script
	window.AXII_HELPERS.observeComputation({
		compute: (computation) => {
			console.log("send message to content script")
			window.postMessage({
				type: 'computation',
				source: 'axii-devtools'
			}, '*');
		}
	})

	window.AXII_HELPERS.injected = true
}

// build graph
function inject() {
	chrome.devtools.inspectedWindow.eval(`(${setupHooks.toString()})()`, (result) => {
		// 可以拿到对象！
		console.log(1111, result)
	})
}


function debounce(fn, duration) {
	let runCallback
	return () => {
		if (runCallback) return
		runCallback = setTimeout(() => {
			// TODO repaint
			fn()
			runCallback = null
		}, duration) // debounce
	}
}

/*****************
 * panel 的入口
 *****************/
document.addEventListener('DOMContentLoaded', function () {
	// 注入从页面 axii 到 content script 的链接。
	inject()

	// // 打开自己和 background 的链接
	// const backgroundPageConnection = chrome.runtime.connect({
	// 	name: "axii panel"
	// });
	//
	// backgroundPageConnection.postMessage({
	// 	name: 'init',
	// 	tabId: chrome.devtools.inspectedWindow.tabId
	// });


	const repaintInterval = setInterval(() => {
		repaint()
	}, 200)

	const repaint = () => {
		// 由于 repaint 做了 debounce, 而 getCurrentIndepTree 又只能获取当前的，所以只有在 debugger 存在时
		// 这个函数才有意义。
		console.log("begin to repaint")
		flashCurrentIndepTree((indeps, exception) => {
			if (indeps) {
				console.log("get indeps", indeps)
				// TODO 绘图
			} else if (exception) {
				console.error(exception)
				clearInterval(repaintInterval)
			}
		})
	}


	const scheduleToRepaint = debounce(() => {
		// TODO repaint,
		repaint()
	}, 100)

	// backgroundPageConnection.onMessage.addListener(function (message) {
	// 	// 收到来自页面的消息了，下面这个函数有 100ms 的 debounce
	// 	console.log("receive message")
	// 	scheduleToRepaint()
	// });

	// TODO 开始渲染界面。
	repaint()
})


/*****************
 * 调用 AXII_HELPERS
 *****************/
function flashCurrentIndepTreeScript() {
	const indepTree = window.AXII_HELPERS.getCurrentIndepTree();
	window.AXII_HELPERS.computation = null;
	return indepTree;
}

function flashCurrentIndepTree(callback) {
	chrome.devtools.inspectedWindow.eval(`(${flashCurrentIndepTreeScript.toString()})()`, callback)
}