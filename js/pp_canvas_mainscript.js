
var isConnected = function(){
	return (navigator.onLine && (RoomListSocket && RoomListSocket.connected))
}


var isAdmin = function(){
	return (isConnected() && $('.cursor-self').hasClass('admin'));
}

var isPrivate = function(){
	return (isConnected() && $('body').hasClass('is-private'));
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



var overlayTimeout = null;

var hideOverlay = function(now){
	if(now){
		clearTimeout(overlayTimeout)
		overlayTimeout = null
	}
	if(overlayTimeout){
		var reset = ( $('.gui').is(':hover') || $('textarea.chat-input').is(':focus') )
		if(reset){
			overlayTimeout = setTimeout(hideOverlay, 2000)
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
			hideOverlay();
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
		return this.brushnames[this.cbrush]
	},
	size: function(size, cursor){
		if(size == undefined) return this.brush().size
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
		if(color == undefined) return this.brush().color
		if(cursor == undefined){
			cursor = $('.canvas-cursor.cursor-self');
		}
		if(cursor.length){
			var cssrgba = rgba2css((color[0] == '#') ? hex2rgb(color) : color)
			cursor.data('color', color);
			//cursor.css({'borderColor': cssrgba, 'background-color': cssrgba})
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
	
    var b = $(window);
    
	
	var alx = b.width()/2,
		aly = b.height()/2
	
	var aax = 	(b.scrollLeft() + alx), 
		aay = 	(b.scrollTop() + aly),
		ccx = 	(ow / (aax)), 
		ccy = 	(oh / (aay))
	
    
	b.scrollTop( b.scrollTop()+(ch/ccy) )
	b.scrollLeft( b.scrollLeft()+(cw/ccx) )
	
	$('.canvas-workarea').width(nw).height(nh).data('zoom', z)
	$('.canvas-cursor').css('transform', 'scale('+z+')').each(function(k, e){
		var ee = $(e),
			nx = (ee.data('x') / w) * nw,
			ny = (ee.data('y') / h) * nh
		ee.css({left: nx, top: ny})
	});
}



var onRoom = function(room){
	console.log('onRoom', room)
	
	$('#main-canvas *').unbind();
	
	this.roomConnected = false;
	this.wantToConnect = false;
	this.canvasNetwork = new roomConnection(this)
	this.canvasCallbacks = new canvasEvents(room, this.canvasNetwork)
	this.canvasChat = new chatScript(this.canvasNetwork)
	var r = this
	
	if(RoomListSocket) {
		RoomListSocket.on('open', function(data){
			/*RoomListSocket.emit('name', {
				name: $('.canvas-cursor.cursor-self').data('name')
			});*/
			console.log('Connected to socket. (connect? %s)', r.wantToConnect)
			if(r.wantToConnect) {
				r.toggleNetwork(true)
			}
		})
		RoomListSocket.on('close', function(data){
			$('.canvas-cursor').not('.cursor-self').remove()
		})
		
	}
	
	this.toggleNetwork = function(net){
		if(!r.canvasNetwork) return false;
		if(net == undefined) net = !isConnected();
		
		
		if(!net) {
			r.canvasNetwork.emit('leave', {room: room});
		}
		else {
			r.canvasNetwork.emit('join', {
			    room: room,
			    name: $('.canvas-cursor.cursor-self').data('name')
			});
		}
	}
	
	this.socketReload = function(callback){
		if(r.canvasNetwork) {
			r.canvasNetwork.emit('img');
			callback();
		}
	}
	
	console.log("Loading canvas storage data.")
	getStorageKey(null, function(data){
		
		var name = data.name || ('unnamed_mofo'+(Date.now().toString().slice(-5)))
		$('.canvas-cursor.cursor-self').data('name', name)
		
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
	
	
	$('.gui .overlay-piece').mouseover(function(e){
		showOverlay(2000)
	}).mouseover(function(e){
		clearTimeout(overlayTimeout);
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

