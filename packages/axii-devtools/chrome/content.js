window.addEventListener('message', function(event) {
	// Only accept messages from the same frame
	if (event.source !== window) {
		return;
	}

	const message = event.data;

	// Only accept messages that we know are ours
	if (typeof message !== 'object' || message === null ||
		!message.source === 'axii-devtools') {
		return;
	}
	console.log("send message to background")
	chrome.runtime.sendMessage(message);
});

