/**
 * background 只有一个，content script 和 panel script 都有多个。
 * background 只是一个消息中转中心，只要把 content script 转发到对应的 panel script 就行了
 */

const connections = {};

// 当开启和 panel 的链接时，保存住 contention。
chrome.runtime.onConnect.addListener(function (port) {

	const extensionListener = function (message, sender, sendResponse) {
		// The original connection event doesn't include the tab ID of the
		// DevTools page, so we need to send it explicitly.
		if (message.name == "init") {
			connections[message.tabId] = port;
			return;
		}

		// other message handling
	}

	// Listen to messages sent from the DevTools page
	port.onMessage.addListener(extensionListener);

	port.onDisconnect.addListener(function(port) {
		port.onMessage.removeListener(extensionListener);

		const tabs = Object.keys(connections);
		for (let i=0, len=tabs.length; i < len; i++) {
			if (connections[tabs[i]] === port) {
				delete connections[tabs[i]]
				break;
			}
		}
	});
});

// 当从 content script 收到消息时，转发给 panel script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// Messages from content scripts should have sender.tab set
	if (sender.tab) {
		const tabId = sender.tab.id;
		if (tabId in connections) {
			connections[tabId].postMessage(request);
		} else {
			console.log("Tab not found in connection list.");
		}
	} else {
		console.log("sender.tab not defined.");
	}
	return true;
});