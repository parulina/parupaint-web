console.log('Starting parupaint chrome...');

var manifest = chrome.runtime.getManifest();

var usblist = [];
console.log("all devices:");
for(var i in manifest.permissions){
	var usbdev = manifest.permissions[i];
	if(typeof usbdev == "object"){
		if(usbdev.usbDevices){
			for(var u in usbdev.usbDevices){
				var dev = usbdev.usbDevices[u];
				if(usblist[dev.vendorId] == undefined) usblist[dev.vendorId] = new Array();
				usblist[dev.vendorId].push(dev.productId);
			}
		}
	}
}


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
	});
});






/*

chrome.usb.getDevices({"vendorId": 5935, "productId": 52}, function(dev){
	if(!dev) return console.log(dev);
	
	chrome.usb.openDevice(dev[0], function(con){
		
		console.log(con);
		chrome.usb.getConfiguration(con, function(config){
			if(!config) return console.log('Couldn\'t retrieve config.');
			console.log('config: ' + config);
		});
	});
});
*/