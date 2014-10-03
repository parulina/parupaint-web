// this is for actual working
var manifest = chrome.runtime.getManifest();
$$ = function(callback){ chrome.runtime.getBackgroundPage(function(page){ callback(page); }) };

var tabletConnection = {connection: null, pressure:0, x: 0, y: 0, name:''};





chrome.hid.getDevices({filters: manifest.permissions[manifest.permissions.length-1].usbDevices}, function(devlist){
	console.log(devlist);

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
				console.log('Connected ('+con.connectionId+').');
				tabletConnection.connection = con.connectionId;
				callback(null);

				var poll = function(){
					chrome.hid.receive(con.connectionId, function(rid, data){
						console.log('-->' + data);
						if(data){
							var a = new Int16Array(data);
							console.log(':' + a);
							document.getElementById('info').innerHTML = 
									("x: " + a[1] + "  y: " + a[2] + "  p: " + a[3] + "     " + a[0].toString(16));
							setTimeout(poll, 0);
						}
					});
				};
				poll();
			});
		});
	}



	var selectTablet = function(vendor, product){
		if(vendor != undefined){
			console.log('setting local data last tablet to: ' + vendor);
			chrome.storage.local.set({last_tablet: {vendorId: vendor, productId: product}}, function(){});
		}
		$('#alert-message').remove();
		$('body').removeClass('loading');
		initParupaint('test');
	};
	if(devlist.length){
		$('#alert-message').text('');


		var listTablets = function(){
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
							$('#alert-message').effect('shake').prepend(ee);
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

			if(data.last_tablet == undefined) {
				console.log('Hmmm, first run...');
				if(devlist.length >= 2){
					listTablets();

				} else if(devlist.length == 1){
					connectTablet(devlist[0].vendorId, devlist[0].productId, function(err){
						if(err){
							$('#alert-message').effect('shake').text('Couldn\'t connect to your tablet. Try and see if it works correctly.');
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
				$('#alert-message').effect('shake').text('Connecting to tablet...');
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