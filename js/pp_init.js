// this is for actual working

if(typeof chrome != 'undefined' && typeof chrome.runtime != 'undefined'){
	var manifest = chrome.runtime.getManifest();
}

var tabletConnection = {connections: 0, pen:0, e:false, p:0, x: 0, y: 0, mx:0, my:0, mp:0, name:'', autoswitch: true};

if(manifest != undefined){
	var devs = manifest.optional_permissions[manifest.optional_permissions.length-1].usbDevices
	var getUsbList = function(){

		var rdevs = []

		for(var pid in devs){
			var d = devs[pid]
			rdevs.push({vendorId: d.vendorId, productId: d.productId})
		}
		return rdevs
	}
}


var removeInit = function(){
    $('#alert-message').remove();
    $('body').removeClass('loading');
    initParupaint('test');
}

$(function(){
	if(typeof manifest != 'undefined' || (typeof chrome == 'undefined' || typeof chrome.hid == 'undefined')) {
		// non chrome browser
		removeInit()
    } else {
		
		chrome.hid.getDevices({filters: getUsbList()}, function(dev){
			console.log('Available devices:', dev)
			
			var i = 0
			var cf = function(){
				
				var d = dev[i]
				console.log('connecting to', d.deviceId)
				chrome.hid.connect(d.deviceId, function(con){
					
					i++
					if(i < dev.length){
						setTimeout(cf, 0)
					}
					
					if(!con) return console.log('Failed connection to device.', d);
					// connected successfully
					console.log('Connected successfully.', d.productId, con.connectionId)
					tabletConnection.connections++
					
					
					
					
					/*
					chrome.hid.receiveFeatureReport(con.connectionId, 2, function(data){
						console.log(d, 'report:', new Uint8Array(data))
					})
					*/
					
					// get the manifest thingy
					
					var tablet_info = null
					for(var pid in devs){
						if(devs[pid].productId == d.productId &&
						  		devs[pid].vendorId == d.vendorId){
							tablet_info = devs[pid]
							break
						}
					}
					
					var mw = 10000,
						mh = 10000,
						mp = 1024

					if(tablet_info){
						if(tablet_info.p) mp = tablet_info.p
						if(tablet_info.w) mw = tablet_info.w
						if(tablet_info.h) mh = tablet_info.h
					}
					var ddpoll = function(){
						
						chrome.hid.receive(con.connectionId, function(r, d){
							setTimeout(ddpoll, 0)
							
							if(d){
								var b = new Uint8Array(d)
								
								// e  eraser
								// P  in promiximity
								// h  is hovering (closer than prox??)
								// d  is pen down
								// h0eP 000d
								
								// 0011 0000 = eraser prox
								// 1011 0000 = eraser hover (cursor moves)
								// 1011 0001 = eraser down
								
								// 0001 0000 = pen prox
								// 1001 0000 = pen hover (cursor moves)
								// 1001 0001 = pen down
								// 
								//         ^ = (& 1)
								//    ^      = (& 16) >> 4

								//todo: individual settings of working area for different tablets?
								
								var ae = ((b[0] & 32) >> 5),
									ax = (b[1] + b[2]*255),
									ay = (b[3] + b[4]*255),
									ap = (b[5] + b[6]*255)
								
								if(ax > mw) mw = ax
								if(ay > mh) mh = ay
								if(ap > mp){
									console.log('Warning, either this device is not configured, or it has the wrong pressure max value. ['+ap+' > '+mp+']')
									mp = ap
								}
								
								if(ae != tabletConnection.e){
									tabletConnection.autoswitch = true
								}
								tabletConnection.focus = (b[0] & 16) >> 4,
								tabletConnection.pen = (b[0] & 1),
								tabletConnection.e = ae,
								tabletConnection.x = ax/mw,
								tabletConnection.y = ay/mh,
								tabletConnection.p = ap/mp
								
								//for debug
								if(ax > tabletConnection.mx) tabletConnection.mx = ax
								if(ay > tabletConnection.my) tabletConnection.my = ay
								if(ap > tabletConnection.mp) tabletConnection.mp = ap

								//console.log((b[1] + b[2]*255), (b[3] + b[4]*255), Array.prototype.join.call(b, ","))
							}
						});
					}
					ddpoll()
					
				});
			}
			
			if(dev && dev.length) cf()
			removeInit(0)
		})
    }
})

function tabletDebug(){
	return [tabletConnection.mx, tabletConnection.my, tabletConnection.mp]
}