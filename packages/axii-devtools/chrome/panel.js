// build graph

function getCurrent() {
	chrome.devtools.inspectedWindow.eval('window.getCurrent()', (result) => {
		// TOOD 可以拿到对象！
		console.log(result)
	})
}

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("button").addEventListener("click", getCurrent)
})

