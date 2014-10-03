// this is for actual working

$$ = function(callback){ chrome.runtime.getBackgroundPage(function(page){ callback(page); }) };


var numdev = 0;
$$(function(page){
	var devlist = [];
	var usblist = page.usblist;
	for(var vendor in usblist){
		for(var p in usblist[vendor]){
			numdev ++;
			var product = usblist[vendor][p];
			console.log('seeking for ' + vendor, product);
			chrome.usb.getDevices({"vendorId":parseInt(vendor), "productId":parseInt(product)}, function(dev){
				numdev--;
				if(!dev || !dev.length) return null;
				
				$('#alert-message').text('Found tablet ' + dev[0]);
				/* // doesn't seem to work...
				console.log(con);
				chrome.usb.getConfiguration(con[0], function(conf){
					console.log(conf);
				});*/
				devlist.push(dev[0]);
			})
		}
	}
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
				connection = con.connectionId;
				callback(null);

					
				chrome.hid.receive(con.connectionId, function(rid, data){
					if(data){
						var a = new Int16Array(data);
						console.log(':' + a);
						document.getElementById('info').innerHTML = 
								("x: " + a[1] + "  y: " + a[2] + "  p: " + a[3] + "     " + a[0].toString(16));
					}
				});
			});
		});
	}
	
	
	
	var tt = setInterval(function(){
		if(numdev == 0 && devlist.length){
			$('#alert-message').text('');
			clearInterval(tt);
			console.log('finished loading');
			if(devlist.length >= 2){
				
				for(var i in devlist){
					console.log(devlist[i]);
					$('#alert-message').append('<a href="#" data-id="'+i+'">Select tablet '+i+' ['+devlist[i].device+']</a>');
				}
				$('#alert-message > a').click(function(){
					var id = $(this).data('id');
					if(id < devlist.length){
						connectTablet(devlist[id].vendorId, devlist[id].productId, function(err){
							if(err){
								var ee = $('<div class="error"></div>').html(err);
								$('#alert-message').effect('shake').prepend(ee);
								setTimeout(function(){
									$('#alert-message div.error').remove();
								}, 800);
							}else{
								$('#alert-message').remove();
								$('body').removeClass('loading');
								initParupaint();
							}
						});
					}
				});
			}
		} else if(devlist.length == 0){
			initParupaint();
		}
	}, 500);
});
