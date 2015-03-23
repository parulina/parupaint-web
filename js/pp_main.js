var url = 'http://sqnya.se:1108';


var loadSqnyaImage = function(url2, callback){
	if(typeof chrome != "undefined" && typeof chrome.app != "undefined" && typeof chrome.app.runtime != "undefined"){
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'blob';
		xhr.onload = function(){
			callback(window.URL.createObjectURL(xhr.response));
		}
		xhr.open('GET', url2, true); xhr.send();	
	} else {
		callback(url2)
	}
	
}



// todo make info packet work, scrap this old code
var updateRoomsTimer = null
var updateRooms = function(){
    
    $('.room-counter').text('').removeAttr('href').removeClass('error').unbind('click')
    
	if(typeof updateRoomsTimer == 'null') return false
	var jj = $.ajax(url + '/info').done(function(data2) {
		
		// get all current room children
		var rest = $('div.show-area').children();
		for(var r in data2)
		{
			var data = data2[r];
			
			var ee = $('#room-' + r);
			if(!ee.length){
				// doesn't room exist? add it
				console.log('added new room ' + r);
				var m = data.lastmod-1;
				
				ee = $('<a/>', 
					   {
					id: 'room-' + r,
					class: 'room-link',
					'data-room': r,
					'data-save': m,
					href:'/#' + r
					   });
				
				$('div.show-area').append(ee);
				
				ee.click(function(){
					var hash = $(this).attr('data-room');
					initParupaint(hash);
					return false;
				})
			}
			// get last mod
			var ss = ee.data('save');
			// filter it out
			rest = rest.not('#room-' + r); 
			var aaa = "";
			if(true)
			{
				var ccc = '';
				for(var c in data.ids){
					ccc += '<li>'+data.ids[c].name+'</li>';
				}
				var active = $('<div class="room-active">last active <span></span></div>');
				active.children('span').livestamp(Math.round(data.lastmod/1000));
				var header = $('<h3></h3>').html(r);
				var list = $('<ul>'+ccc+'</ul>');

				aaa = $('<div class="room-info"></div>').append(active, header, list);
			}
			ee.html(aaa);
			if(ss != data.lastmod){
				loadSqnyaImage(url + '/'+(r + '/image?' + Date.now()), function(url){
					ee.css('background-image', 'url('+url +')');
				})
				
			}
			ee.data('save', data.lastmod);
			
			
		}
		var ll = Object.keys(data2).length;
		$('.room-counter').text(ll + ' room'+(ll == 1 ? '' : 's')+' active');

		rest.remove();
		updateRoomsTimer = setTimeout(updateRooms, 3000);
        
        
	}).error(function(xhr, ts, err){
        console.log(xhr, ts, err)
		$('.room-counter').text('Error contacting server ('+ ts +').').addClass('error').attr('href', '#').click(function(e){
            updateRooms()
        });
	});
	return false;
};


var connectSocket = function(){
	$('.room-counter').text('Connecting...');


	RoomListSocket = new golem.Connection('ws://sqnya.se:1108/main', false);
	var tt = setTimeout(function(){
		$('.room-counter').text('Can\'t connect...?');
	}, 5000);
	
	RoomListSocket.on('close', function(data){
		$('.room-counter').text('Can\'t connect.');
		clearTimeout(tt)

	}).on('open', function(data){
		$('.room-counter').text('Connected.');
		RoomListSocket.emit('info');
		clearTimeout(tt)

	})
}

var isConnectedSocket = function(){
	return (typeof RoomListSocket != "undefined" && typeof RoomListSocket.ws != "undefined" && RoomListSocket.ws.readyState == 1);
}




initParupaint = function(room, opt){
	document.title = 'Starting up...';
	
	
	
	window.location.hash = '';
	if(typeof room == 'string' && room.length){
		
		window.location.hash = '#' + room;
	}
	
	$('body').removeClass('room canvas main is-private is-admin');
	$('.room-status-bar .opt-notify').text('');
	
	if(navigator.onLine && !isConnectedSocket()) {
		connectSocket();
	}
	if(typeof ROOM != "undefined" && typeof ROOM.canvasNetwork != "undefined"){
		// send leave event.. ?
		console.log('Cleanup room stuff.');
		ROOM.canvasNetwork.emit('leave')
		delete ROOM.canvasNetwork;
		delete ROOM.canvasCallbacks;
		
		delete ROOM;
	}
	
	
	if(!room){
		console.log('→ Creating lobby...');
		document.title = '-- parupaint home --';
		
		if(typeof chrome != "undefined" && typeof chrome.permissions != "undefined"){
			chrome.permissions.contains({permissions:['hid']}, function(e){
				if(e){
					$('input.set-tablet').addClass('enabled')
				}
			})
		}
		
		getStorageKey('name', function(d){
			if(d && d.name){
				$('input.name-input').val(d.name)
			}
		})
		
		
		$('body').addClass('main');
		RoomListSocket.on('info', function(data){
			console.log("info:", data)

		})
		
		if(typeof opt != "undefined") {
			$('.room-status-bar .opt-notify').text(opt)
		}
			
			
	} else {
		
		console.log('→ Creating room...');
		
		document.title = ''+room+' (offline)';
		
		$('body').addClass('canvas');
		document.location.hash = room;
		
		if(onRoom){
			ROOM = new onRoom(room);
		}
	}
	
};

var getRoom = function(){
	return document.location.hash.substr(1)
}















