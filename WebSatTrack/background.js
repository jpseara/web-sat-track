chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('web-sat-track.html', {
		'outerBounds': {
			'width': 800,
			'height': 600,
		},
		"resizable": true,
	});
});