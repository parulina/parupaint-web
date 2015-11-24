console.info('Starting parupaint Chrome app...');
chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
		id: "window",
		singleton: true
	}, function(window){
		// I'm not sure what i want it to happen here.
		window.onMaximized.addListener(function(){
		});
		window.onRestored.addListener(function(){
		});

	});
})
