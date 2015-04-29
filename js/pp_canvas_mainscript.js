
var isConnected = function(){
return false;
}



var updateInfo = function(){
	var layer = $('canvas.focused').data('layer'),
		frame = $('canvas.focused').data('frame'),
		connected_label = isConnected() ? 'multi' : 'single', // connected to socket room
		room = getRoom(),
		width = parseInt($('canvas.focused')[0].width),
		height = parseInt($('canvas.focused')[0].height)


	$('.qstatus-piece.qinfo').attr('data-label', layer).attr('data-label-2', frame).attr('data-label-3', connected_label)
	$('.qstatus-message').attr('data-label', room)
	$('.qstatus-piece.qinfo').toggleClass('online', navigator.onLine)

	var players = $('.canvas-cursor').not('.cursor-self')
	$('.qstatus-piece.preview-col').attr('data-label-2', players.length)

	var list = $('<ul/>', {class: 'player-list'}).text("You're quite lonely.")

	if(players.length){
		list.html('')
		players.each(function(k, e){
			list.append($('<li/>', {class: 'player-list-entry'}).text($(e).data('name')))
		})
	}
	$('.brush-panel').html(list)

	$('form.dimension-input .dimension-w-input').val($('canvas.focused').get(0).width)
	$('form.dimension-input .dimension-h-input').val($('canvas.focused').get(0).height)

	Brush.update()

	if(true){
		var connected = isConnected();


		var msg = connected ? 'Connected' : 'Disconnected';
		$('form.connection-input').toggleClass('enable', connected).attr('data-label', msg)
		$('input.con-status').get(0).checked = connected
		$('body').toggleClass('connected', connected)



		$('body').toggleClass('is-admin', isAdmin()) //if i'm admin, put the body to admin mode. yass
		$('input.private-status').get(0).checked = isPrivate()
	}



	document.title = 	'[' + room + '] ' +
						players.length + ' artists' +
						' ['+width+' × '+height+']'
}


$(document).keydown(function(e){
	switch(e.keyCode){
			case 116:
			{
				return chrome.runtime.reload()
			}

			case 123:
			{
				var fperm = {permissions:['alwaysOnTopWindows']}
				chrome.permissions.contains(fperm, function(e){
					if(e){
						if(chrome.app.window.current().isAlwaysOnTop()){
							console.log('always on top -> false')
							return chrome.app.window.current().setAlwaysOnTop(false)
						}
						console.log('always on top -> true')
						return chrome.app.window.current().setAlwaysOnTop(true)

					} else {
						chrome.permissions.request(fperm)
					}
				})
				break;
			}
			case 13:
			{
				if(e.altKey){
					if(chrome.app.window.current().isFullscreen()){
						return chrome.app.window.current().restore()
					}
					return chrome.app.window.current().fullscreen()

				}
				break;
			}
	}
})




var saveCanvasLocal = function(r){
	if(r == undefined) r = 'default'
	getStorageKey('rooms', function(roomdata){

		var d = roomdata.length ? roomdata.rooms : undefined;

		if(d == undefined) 		d = {};
		if(d[r] == undefined)	d[r] = {};

		console.log('Saving ['+r+']...')


		var pool = $('.canvas-pool').children();
		if(pool.length){
			d[r].width = $('#flayer-0-0')[0].width;
			d[r].height = $('#flayer-0-0')[0].height;
			d[r].data = [];

			for(var l = 0; l < pool.length; l++){

				if(!$('#flayer-' + l + '-0').length) break;

				if(d[r].data[l] == undefined) d[r].data[l] = [];

				for(var f = 0; f < pool.length; f++){
					var flayer = $('#flayer-' + l + '-' + f)
					if(!flayer.length) break;

					if(d[r].data[l][f] == undefined) d[r].data[l][f] = {data:null};
				//	someday, when chrome allows saving with array...
				//	d[r].data[l][f].data = ''
				//	d[r].data[l][f].data = flayer[0].getContext('2d').getImageData(0, 0, flayer[0].width, flayer[0].height).data;
					d[r].data[l][f].data = flayer[0].toDataURL();
				}
			}
		}
		setStorageKey({rooms: d}, function(){
			console.log('Finish writing')
		});
	});
}

var setZoom = function(z){
	if(z == undefined) z = 1.0

}



var onRoom = function(room){
	return false;
	console.log('onRoom', room)

	$('#main-canvas *').unbind();

	this.room = room;
	this.brushStrokeRoundtrip = false;

	this.roomConnected = false;
	this.wantToConnect = false;
	this.canvasNetwork = new roomConnection(this)
	this.canvasCallbacks = new canvasEvents(this, this.canvasNetwork)
	this.canvasChat = new chatScript(this.canvasNetwork)
	var r = this


	console.log("Loading canvas storage data.")
	getStorageKey(null, function(data){

		var name = data.name || ('unnamed_mofo'+(Date.now().toString().slice(-5)))
		$('.canvas-cursor.cursor-self').data('name', name)

		if(data.brushDefaults){
			var def = JSON.parse(data.brushDefaults);
			Brush.brushes = def;
			Brush.update()
		}
		guiControl.updateFromBrush(Brush);

		if(data.rooms && data.rooms[room]){
		   if(data.rooms[room].data){
				console.log('Room is saved.', data.rooms[room].data)
				var layers = []
				for(var l in data.rooms[room].data){
					layers[l] = data.rooms[room].data[l].length
				}
				var w = data.rooms[room].width || 500,
					h = data.rooms[room].height || 500

				initCanvas(w, h, layers)
				for(var l in data.rooms[room].data){
					for(var f in data.rooms[room].data[l]){
						var cc = data.rooms[room].data[l][f];
						var nc = $('#flayer-' + l + '-' + f)
						if(nc.length){

							var img = new Image
							img.src = cc.data
							nc[0].getContext('2d').drawImage(img, 0, 0);
						}
					}
				}


			} else {
				addMessage("couldn't load canvas data... save file might be corrupted?")
			}
		} else {
			console.log('New canvas')
			initCanvas(500, 500, [[{}, {}], [{}, {}]])
		}


        if(data.plugin){
			console.log('Adding wacom plugin.');
            $('body').prepend(
                $('<object/>', {id: 'wacomPlugin', type: 'application/x-wacomtabletplugin'})
            );
        }

		// rest init
		updateInfo()
		updateFrameinfoSlow()

		if(navigator.onLine && RoomListSocket.ws.readyState == 1){
			r.toggleNetwork(true)
		} else if(RoomListSocket.ws.readyState == 0){
			r.wantToConnect = true;
		}
	});


	$('.gui .overlay-piece').on('mouseover mousemove', function(e){
		guiControl.show(false);
	});


	$('.setting-bottom-row > div[type="button"]').click(function(ee){
		var e = $(ee.target)
		if(e.is('.setting-quit-btn')){
			if($(this).hasClass('confirm')){
				//window.location = '/';
				initParupaint()
			} else {
				$(this).addClass('confirm')
				$(this).mouseout(function(){
					$(this).removeClass('confirm').unbind('mouseout')
				})
			}
		} else if(e.is('.setting-down-img')){
			downloadCanvas()
		} else if(e.is('.setting-save-img')){
			saveCanvasLocal(room);
		} else if(e.is('.setting-reload-img')){
			r.socketReload();
		}
	})


	$('input.con-status').change(function(e){
		var c = $(e.target).is(':checked')

		r.toggleNetwork(c)
	})
	$('input.private-status').change(function(e){
		var c = $(e.target).is(':checked')
		if(isAdmin()){
			r.canvasNetwork.emit('rs', {private: c})
		}
	})






	$('.qstatus-message').mousedown(function(e){
		guiControl.show(false);
	})

	$('form.dimension-input').submit(function(){
		var w = parseInt($(this).children('.dimension-w-input').val()),
			h = parseInt($(this).children('.dimension-h-input').val());

		if(isConnected()){
			r.canvasNetwork.emit('r', {width: w, height: h})
		} else {
			initCanvas(w, h)
		}

		saveCanvasLocal(room)
		return false;
	})

	$('.flayer-list').bind('mousewheel', function(e, d){
		if($('.flayer-info-layer').has($(e.target)).length){
			//is on layer
			var n = (d > 0) || -1
			advanceCanvas(null, n)
		}else {
			this.scrollLeft -= (e.originalEvent.wheelDelta)
		}
	}).click(function(e){
		if($('.flayer-info-layer').has($(e.target)).length){
			// is a frame from one of the layers?
			var f = parseInt($(e.target).data('frame')),
				l = parseInt($(e.target).parent().data('layer'))
			console.log('click on', l, f)
			focusCanvas(l, f)
		}
	})



	$(window).scroll(function(){
		if($('.qstatus-brush, .qstatus-settings').hasClass('panel-open')) return false;
	})



	colorScript(function(oldc, newc){
		addPaletteEntryRgb(newc)
		Brush.color(rgb2hex(newc)).update()
		writeDefaults();
	})
}
