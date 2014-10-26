var isSocket = function(){
	return (typeof ROOM != 'undefined' && ROOM.roomSocket.socket)
}

var isConnected = function(){
	return (navigator.onLine && (isSocket() && ROOM.roomSocket.connected() ))
}
var isAdmin = function(){
	return (navigator.onLine && (isSocket() && ROOM.roomSocket.isAdmin() ))
}

var isPrivate = function(){
	return (navigator.onLine && (isSocket() && ROOM.roomSocket.private() ))
}


var updateInfo = function(){
	var layer = $('canvas.focused').data('layer'),
		frame = $('canvas.focused').data('frame'),
		connected = isConnected() ? 'multi' : 'single', // connected to socket room
		room = getRoom(),
		width = parseInt($('canvas.focused')[0].width),
		height = parseInt($('canvas.focused')[0].height)
	
	
	$('.qstatus-piece.qinfo').attr('data-label', layer).attr('data-label-2', frame).attr('data-label-3', connected)
	$('.qstatus-message').attr('data-label', room)
	$('.qstatus-piece.qinfo').toggleClass('online', navigator.onLine)
	
	var players = $('.canvas-cursor').not('.cursor-self')
	$('.qstatus-piece.preview-col').attr('data-label-2', players.length)
	
	var list = $('<ul/>', {class: 'player-list'}).text("You're quite lonely.")
	
	if(players.length){
		list.html('')
		players.each(function(k, e){
			list.append($('<li/>', {class: 'player-list-entry'}).text('painter'))
		})
	}
	$('.brush-panel').html(list)
	
	$('form.dimension-input .dimension-w-input').val($('canvas.focused').get(0).width)
	$('form.dimension-input .dimension-h-input').val($('canvas.focused').get(0).height)
	
	Brush.update()
	
	if(isSocket()){
		var msg = ROOM.roomSocket.socket.connected ? 'Connected' : 'Disconnected'
		
		if(ROOM.roomSocket.socket.io.reconnecting){
			var a = ROOM.roomSocket.socket.io.attempts,
				am = ROOM.roomSocket.socket.io.reconnectionAttempts()
			
			msg = 'Reconnecting ['+a+'/'+am+']...'
		}
		
		$('form.connection-input').toggleClass('enable', isConnected()).attr('data-label', msg)
		
		$('input.con-status').get(0).checked = ROOM.roomSocket.socket.connected
		$('body').toggleClass('connected', ROOM.roomSocket.socket.connected)
		
		
		
		$('body').toggleClass('is-admin', isAdmin()) //if i'm admin, put the body to admin mode. yass
		$('body').toggleClass('is-private', isPrivate())
		$('input.private-status').get(0).checked = isPrivate()
	}
	
	
	
	document.title = 	'[' + room + '] ' + 
						players.length + ' artists' +
						' ['+width+' × '+height+']'
}



var overlayTimeout = null;

var hideOverlay = function(now){
	if(now){
		clearTimeout(overlayTimeout)
		overlayTimeout = null
	}
	if(overlayTimeout){
		var reset = ( $('.gui').is(':hover') || $('textarea.chat-input').is(':focus') )
		if(reset){
			overlayTimeout = setTimeout(overlayGone, 2000)
			return false;
		}
	}
	clearTimeout(overlayTimeout);
	$('.overlay .gui').removeClass('visible');
	$('#mouse-pool').focus()
}


var showOverlay = function(t){
	if(t != undefined){
		clearTimeout(overlayTimeout);
		overlayTimeout = setTimeout(function(){
			hideOverlay(true)
		}, 3000);
	}
	if(!$('.gui').hasClass('visible')){
		$('.gui').addClass('visible');
	} else {
		var ta = $('textarea.chat-input')
		if(ta.is(':focus')){
			ta.select()
		}
		ta.focus()
	}
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



var drawCanvasLine = function(canvas, x1, y1, x2, y2, color, width){
	if(canvas == null){
		canvas = $('canvas.focused')
	}
	
	if(canvas.length)
	{
		var ctx = canvas[0].getContext('2d');
		
		
		var composite = ctx.globalCompositeOperation;
		var col = hex2rgb(color);
		
		if(!col.a) {
			ctx.globalCompositeOperation = "destination-out";
			col.a = 255;
		}
		ctx.strokeStyle = 'rgba('+col.r+','+col.g+','+col.b+','+(col.a/255.0)+')'
		
		ctx.lineWidth = width;
		ctx.lineCap = 'round';

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

		ctx.globalCompositeOperation = composite;


	}
}


var Brush = {
	tmoving:false,
	tbrushzoom:false,
	tzoomcanvas:false,
	tzoomstart:null,
	ttsize:null,
	
	beraser:3,
	bmove:2,
	tabdown:false,
	
	cbrush:0,
	brushnames:['brush','eraser'],
	brushes:[
		{size:1, color:'#000'},
		{size:16, color:'#00000000'}
	],
	brush: function(b){
		if(b != undefined) 	this.cbrush = b;
		return this.brushes[this.cbrush];
	},
	brushname: function(){
		return this.brushnames[this.cbrush];
	},
	size: function(size, cursor){
	
		if(cursor == undefined){
			cursor = $('.canvas-cursor.cursor-self');
		}
		if(cursor.length){
			cursor.data('size', size);
			cursor.css({width: size, height:size})
			if(cursor.hasClass('cursor-self')) this.brush().size = size;
		}
		return this;
	},
	color: function(color, cursor){
		if(cursor == undefined){
			cursor = $('.canvas-cursor.cursor-self');
		}
		if(cursor.length){
			var cssrgba = rgba2css((color[0] == '#') ? hex2rgb(color) : color)
			cursor.data('color', color);
			cursor.css({borderColor: cssrgba, 'background-color': cssrgba})
			if(cursor.hasClass('cursor-self')) this.brush().color = color;
		}
		return this;
	},
	update: function(){

		var cursor = $('.canvas-cursor.cursor-self')
		this.size(this.brush().size, cursor)
		this.color(this.brush().color, cursor)
		cursor.removeClass('eraser')
		if(this.cbrush == 1){
			cursor.addClass('eraser')
		}
		var cssrgba = rgba2css((this.brush().color[0] == '#') ? hex2rgb(this.brush().color) : this.brush().color)
		$('.qstatus-piece.preview-col').css('background-color', cssrgba).attr('data-label', this.brushname())
		return this;
	}
}



var failSafe = function(){
	
}

var writeDefaults = function(){
	setStorageKey({brushDefaults: JSON.stringify(Brush.brushes)}, failSafe);
}



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
	
	var w = $('canvas.focused').get(0).width,
		h = $('canvas.focused').get(0).height,
		ow = $('.canvas-workarea').width(),
		oh = $('.canvas-workarea').height(),
		// change x, y
		cw = (z*w) - ow,
		ch = (z*h) - oh,
		nw = ow + cw,
		nh = oh + ch
	
	
	var alx = $('html').width()/2,
		aly = $('html').height()/2
	
	var aax = 	($('body').scrollLeft() + alx), 
		aay = 	($('body').scrollTop() + aly),
		ccx = 	(ow / (aax)), 
		ccy = 	(oh / (aay))
	
	$('body').scrollTop( $('body').scrollTop()+(ch/ccy) )
	$('body').scrollLeft( $('body').scrollLeft()+(cw/ccx) )
	
	$('.canvas-workarea').width(nw).height(nh).data('zoom', z)
	$('.canvas-cursor').css('transform', 'scale('+z+')').each(function(k, e){
		var ee = $(e),
			nx = (ee.data('x') / w) * nw,
			ny = (ee.data('y') / h) * nh
		ee.css({left: nx, top: ny})
	});
}



var onRoom = function(room){
	addMessage('loading parupaint...')
	console.log('new room:', room)
	
	
	// initialize room socket
	
	this.roomSocket = new roomSocketConnection(room)
	this.canvasCallbacks = new canvasEvents(room, this.roomSocket)
	var r = this
		
	this.toggleNetwork = function(net){
		if(net == undefined) net = !isConnected()
		
		if(!net) 		return this.roomSocket.socket.io.disconnect()
		else			return this.roomSocket.socket.io.connect()
	}
	
	getStorageKey(null, function(data){
		
		var name = data.name || ('unnamed_mofo'+(Date.now().toString().slice(-5)))
		$('.canvas-cursor.cursor-self').data('name', name)
		
		r.roomSocket.query({name: name})
		
		
		
		
		if(data.brushDefaults){
			var def = JSON.parse(data.brushDefaults);
			Brush.brushes = def;
			Brush.update()
		}
		updateInterfaceHex(Brush.brush().color)
		
		if(data.rooms && data.rooms[room]){
		   if(data.rooms[room].data){
				console.log('Room is saved.', data.rooms[room].data)
				var layers = []
				for(var l in data.rooms[room].data){
					layers[l] = data.rooms[room].data[l].length
				}
				var w = data.rooms[room].width || 500,
					h = data.rooms[room].height || 500

				initCanvas(w, h, layers.length, layers)
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
			initCanvas(500, 500, 2, [2, 2])
		}
		
		
		// rest init
		updateInfo()
		updateFrameinfoSlow()
	});
	
	
	$('.gui .overlay-piece').mouseout(function(e){
		showOverlay(2000)
	}).mouseover(function(e){
		clearTimeout(overlayTimeout);
	});
	
	$('.setting-bottom-row > div[type="button"]').click(function(ee){
		var e = $(ee.target)
		if(e.is('.setting-quit-btn')){
			if($(this).hasClass('confirm')){
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
			saveCanvasLocal(room)
		}
	})
	
	
	$('input.con-status').change(function(e){
		var c = $(e.target).is(':checked')
		r.toggleNetwork(c)
	})
	$('input.private-status').change(function(e){
		var c = $(e.target).is(':checked')
		if(isAdmin()){
			ROOM.roomSocket.socket.emit('rs', {private: c})
		}
	})
	
	
	
	
	
	
	$('.qstatus-message').mousedown(function(e){
		showOverlay(2000)
	})
	
	$('.qstatus-brush, .qstatus-settings').click(function(e){
		var toq = null
		if(!$('.qstatus-panel').has(e.target).length){
			var t = $(this)
			$('.qstatus-brush, .qstatus-settings').removeClass('panel-open')
			
			t.toggleClass('panel-open')
		}
		
	})
	
	$('form.dimension-input .dimension-confirm').click(function(){
		var w = $(this).parent().children('.dimension-w-input').val(),
			h = $(this).parent().children('.dimension-h-input').val()
		initCanvas(w, h)
		saveCanvasLocal(room)
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
	
	chatScript(room)
	
	colorScript(function(oldc, newc){
		console.log(oldc, '->', newc)
		addPaletteEntryRgb(newc)
		Brush.color(rgb2hex(newc)).update()
		writeDefaults();
	})
}

