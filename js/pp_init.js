// this is for actual working


var manifest = chrome.runtime.getManifest();
$$ = function(callback){ chrome.runtime.getBackgroundPage(function(page){ callback(page); }) };

var tabletConnection = {connection: null, pen:0, e:false, p:0, x: 0, y: 0, name:'', autoswitch: true};


var devs = manifest.optional_permissions[manifest.optional_permissions.length-1].usbDevices

var selectTablet = function(vendor, product){
    if(vendor != undefined){
        console.log('setting local data last tablet to: ' + vendor);
		
		var data = {vendorId: vendor, productId: product}
		if(vendor){
			for(var i in devs){
				if(devs[i].vendorId == vendor && devs[i].productId == product){
					data.name = devs[i].name
				}
			}
		}
        chrome.storage.local.set({last_tablet: data}, function(){});
    }
    $('#alert-message').remove();
    $('body').removeClass('loading');
    initParupaint('test');
};

var getUsbList = function(){
	
	var rdevs = []

	for(var pid in devs){
		var d = devs[pid]
		rdevs.push({vendorId: d.vendorId, productId: d.productId})
	}
	return rdevs
}

function _copy(str, mimetype) {
    document.oncopy = function(event) {
        event.clipboardData.setData(mimetype, str);
        event.preventDefault();
    };
    document.execCommand("Copy", false, null);
}



$(function(){
    if(!chrome.hid){
        selectTablet(0)

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
					
					var mw = 20000,
						mh = 12452,
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
								
								var ae = ((b[0] & 32) >> 5)
								if(ae != tabletConnection.e){
									tabletConnection.autoswitch = true
									tabletConnection.e = ae
								}
								tabletConnection.focus = (b[0] & 16) >> 4,
								tabletConnection.pen = (b[0] & 1),
								tabletConnection.x = (b[1] + b[2]*255)/mw,
								tabletConnection.y = (b[3] + b[4]*255)/mh,
								tabletConnection.p = (b[5] + b[6]*255)/mp
								

								console.log((b[1] + b[2]*255), (b[3] + b[4]*255), Array.prototype.join.call(b, ","))
							}
						});
					}
					ddpoll()
					
				});
			}
			cf()
			selectTablet(0)
		})
    }
})
