// this is for actual working


var manifest = chrome.runtime.getManifest();
$$ = function(callback){ chrome.runtime.getBackgroundPage(function(page){ callback(page); }) };

var tabletConnection = {connection: null, pen:0, p:0, x: 0, y: 0, name:''};


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

var ddpoll = function(){
	chrome.hid.receive(tabletConnection.connection, function(r, d){
		setTimeout(ddpoll, 0)
		if(d){
			/*
			if(d.byteLength == 7){
				var aa = new Int8Array(d.byteLength + 1)
				aa.set(new Int8Array(d), 0)
				d = aa.buffer
			}*/
			var b = new Uint8Array(d)
			
			
			// 00010000 = not on tablet
			// 00010001 = on tablet
			//        ^ = (& 1)
			//    ^     = (& 16) >> 4
			
			//todo: individual settings of working area for different tablets?
			tabletConnection.focus = (b[0] & 16) >> 4,
			tabletConnection.pen = (b[0] & 1),
			tabletConnection.x = (b[1] + b[2]*255)/20000,
			tabletConnection.y = (b[3] + b[4]*255)/12452,
			tabletConnection.p = (b[5] + b[6]*255)/1024
			
			//console.log(Array.prototype.join.call(b, ","))
		}
	});
};


$(function(){
    if(!chrome.hid){
        selectTablet(0)

    } else {
		
		var rdevs = getUsbList()
		var devthing = {filters: rdevs}
		
		try{
			chrome.hid.getDevices(devthing, function(){});
		} catch(e){
			/*
			var ee = $('<div class="error"></div>').append(e).append('<br/>Tablet detection only works in chrome dev channel.<br/>Click to continue.');
			$('#alert-message').effect('shake').prepend(ee);
			$('html').click(function(){
				$('#alert-message div.error').remove();
				selectTablet(0)
			});
			
			return 1;
			*/
			console.log('beta getDevices', e)
			devthing = {vendorId: rdevs[0].vendorId, productId: rdevs[0].productId}
		}
		console.log('devices:', devthing)
        chrome.hid.getDevices(devthing, function(devlist){
			console.log('available devices:', devlist)
            var connectTablet = function(vendor, product, callback){
                chrome.hid.getDevices({ "vendorId": parseInt(vendor), "productId": parseInt(product)}, function(dev) {
                    if(!dev || !dev.length){
                        console.log('device not found.');
                        return callback(new Error('Device not found.'));
                    }	


                    chrome.hid.connect(dev[0].deviceId, function(con){
                        if(!con) {
                            console.log('Failed connection.');
                            return callback(new Error('Failed connection.'));
                        }
                        console.log('Connected.', con);
                        tabletConnection.connection = con.connectionId;
                        callback(null);

                        
                        ddpoll();
                    });
                });
            }



            if(devlist.length){
                $('#alert-message').text('Connecting...');


                var listTablets = function(){
					$('#alert-message').text('');
                    $('#alert-message').append('<a href="#" data-id="-1">Don\'t use any tablet.</a>');
                    for(var i in devlist){
                        console.log(devlist[i]);
                        $('#alert-message').append('<a href="#" data-id="'+i+'">Select tablet '+i+' ['+devlist[i].device+']</a>');
                    }
                    $('#alert-message > a').click(function(){
                        var id = $(this).data('id');
                        if(id < devlist.length && id >= 0){
                            connectTablet(devlist[id].vendorId, devlist[id].productId, function(err){
                                if(err){
                                    var ee = $('<div class="error"></div>').html(err);
                                    $('#alert-message').prepend(ee);
                                    setTimeout(function(){
                                        $('#alert-message div.error').remove();
                                    }, 3000);
                                }else{
                                    selectTablet(devlist[id].vendorId, devlist[id].productId);
                                }
                            });
                        } else {
                            selectTablet(0);
                        }
                    });
                };

                chrome.storage.local.get('last_tablet', function(data){

					console.log(data.last_tablet)
                    if(data.last_tablet == undefined) {
                        console.log('Hmmm, first run...');
                        if(devlist.length >= 2){
                            listTablets();

                        } else if(devlist.length == 1){
                            connectTablet(devlist[0].vendorId, devlist[0].productId, function(err){
                                if(err){
                                    $('#alert-message').text('Couldn\'t connect to your tablet. Try and see if it works correctly.');
                                    setTimeout(function(){
                                        selectTablet();
                                    }, 3000);
                                } else {
                                    selectTablet(devlist[0].vendorId, devlist[0].productId);
                                }
                            });
                        }
                    } else if(data.last_tablet.vendorId == 0){

                        selectTablet();

                    } else if(data.last_tablet.vendorId != 0){
                        $('#alert-message').text('Connecting to tablet...');
                        connectTablet(data.last_tablet.vendorId, data.last_tablet.productId, function(err){
                            if(err){
                                console.log('something went wrong.');
                                var ee = $('<div class="error"></div>').html('Couldn\'t connect to tablet.');
                                $('#alert-message').html('');
                                listTablets();
                                $('#alert-message').prepend(ee);
                                setTimeout(function(){ $('#alert-message div.error').remove(); }, 3000);

                            } else {
                                console.log('Auto-connected to ' + data.last_tablet.vendorId, data.last_tablet.productId);
                                selectTablet(data.last_tablet.vendorId, data.last_tablet.productId);
                            }
                        });

                    }


                });


            } else if(devlist.length == 0){
                selectTablet();
            }
        });
    }
})
