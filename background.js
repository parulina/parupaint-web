console.log('Starting parupaint chrome...');

chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('parupaint.html', {
		id: "window",
		singleton: true
	}, function(window){

		window.onMaximized.addListener(function(){
			console.log('maximized...');
		});
		window.onRestored.addListener(function(){
			console.log('restored...');
		});
		window.onRemoved.addListener(function(){
		   //chrome.runtime
		});

	});
})