
var updateInfo = function(){
	var layer = $('canvas.focused').data('layer'),
		frame = $('canvas.focused').data('frame'),
		connected = false ? 'multi' : 'single',// todo socket
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
	
	
	document.title = 	'[' + players.length + ' artists]' +
						'['+width+' × '+height+']' + 
						' in [' + room + ']'
}

var overlayTimeout = null;
var overlayGone = function(now){
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
	$('.overlay .qstatus').removeClass('visible');
	$('#mouse-pool').focus()
};

var overlayShow = function(full){
	if(full){
		if(!$('.gui').hasClass('visible')){
			$('.gui').addClass('visible');

			$('.overlay .qstatus').removeClass('visible');
		} else {
			var ta = $('textarea.chat-input')
			if(ta.is(':focus')){
				ta.select()
			}
			ta.focus()
		}
	} else {
		if($('.gui').hasClass('visible')){
			$('.gui').removeClass('visible')
		}
		$('.qstatus').addClass('visible')
	}
}



var ignoreGui = false;
$(document).keydown(function(e){
	switch(e.keyCode){
			case 116:
			{
				return chrome.runtime.reload()
			}
			case 27:
			{
				overlayGone(true)
				
				break;
			}
			
			case 123:
			{
				var fperm = {permissions:['alwaysOnTopWindows']}
				chrome.permissions.contains(fperm, function(e){
					console.log(e)
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
}).keyup(function(e){
	
	if(e.keyCode == 9)
	{
		if(!ignoreGui){

			if(e.shiftKey){
				if($('.gui').hasClass('visible')) {
					overlayShow(false)
				}else {
					overlayGone(true)
				}
			}else{
				var qs = $('.qstatus')

				if($('.gui').hasClass('visible')){
					overlayShow(true)
					return false;
				}else{
					if(qs.length){
						if(qs.hasClass('visible')){
							overlayShow(true)
						} else {
							overlayShow(false)
						}
					}
				}

			}
			return false;
		}
		ignoreGui = false
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
	chrome.storage.local.set({brushDefaults: JSON.stringify(Brush.brushes)}, failSafe);
}



var saveCanvasLocal = function(r){
	if(r == undefined) r = 'default'
	chrome.storage.local.get('rooms', function(roomdata){
		
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
					console.log()
				}
			}
		}
		chrome.storage.local.set({rooms: d}, function(){
			console.log('Finish writing')					 
		});
	});
}



onRoom = function(room){
	addMessage('loading parupaint...')
	
	chrome.storage.local.get(null, function(data){
		
		if(data.brushDefaults){
			var def = JSON.parse(data.brushDefaults);
			Brush.brushes = def;
			Brush.update()
		}
		updateInterfaceHex(Brush.brush().color)
		
		$('.canvas-cursor.cursor-self').data('name', data.name || ('unnamed_mofo'+(Date.now().toString().slice(-5))))
		
		
		
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
		
		
		
		
		
		// real init
		
		
		updateCallbacks(function(e, data){

			if(e == 'mousemove'){	

				var drawing = (data.button == 1);
				var moving = (Brush.tmoving || data.button == Brush.bmove);

				//todo: store with zoom offset
				Brush.mx = data.x;
				Brush.my = data.y;
				var cursor = $('.canvas-cursor.cursor-self');
				if(cursor.length){
					var left = parseInt(cursor.css('left')), top = parseInt(cursor.css('top'));
					var dx = (data.x - left), dy = (data.y - top);
					var dist = Math.sqrt(dx*dx + dy*dy)
					if(dist > (drawing ? 2 : 15)){
						cursor.css({left: data.x, top:data.y});
					}
				}
				if(moving){
					var b = $('body');
					b.scrollLeft(b.scrollLeft() - data.sx);
					b.scrollTop(b.scrollTop() - data.sy);
				}
				else if(drawing){

					var nx1 = ((data.x - data.cx));
					var ny1 = ((data.y - data.cy));
					var nx2 = ((data.x));
					var ny2 = ((data.y));
					var s = parseInt(cursor.data('size')) || Brush.brush().size;
					var c = Brush.brush().color || cursor.data('color');

					drawCanvasLine(null, nx1, ny1, nx2, ny2, c, s)
				}
			}else if(e == 'mousedown'){
				console.log('button', data.button)
				if(data.button == Brush.beraser){
					var newbrush = Brush.cbrush == 0 ? 1 : 0;
					Brush.brush(newbrush)
					Brush.update()
					updateInterfaceHex(Brush.brush().color)
					
				}
				else if(data.button == 1){
					$('.canvas-cursor.cursor-self').addClass('drawing')
				}
				else if(data.button == Brush.bmove){
					$('#mouse-pool').focus()
					return false;
				}
			}else if(e == 'mouseup'){
				if(data.button == 1){


					$('.canvas-cursor.cursor-self').removeClass('drawing')
					saveCanvasLocal(room);


				}
			} else if(e == 'mousewheel'){
				console.log(data.target)
				var a = data.scroll > 0 ? 2 : 0.5;
				var cursor = $('.canvas-cursor.cursor-self')
				var s = parseInt(cursor.data('size'))
				s *= a;
				if(s < 1) s = 1;
				if(s > 256) s = 256;

				Brush.size(s).update()
				writeDefaults()

				return false;
			} else if(e == 'keydown'){
				console.log(data.key)

				switch(data.key){
						case 82:
						{
							if(!$('.canvas-cursor.cursor-self').hasClass('pick-color')){
								$('.canvas-cursor.cursor-self').addClass('pick-color')
							}
							var cc = $('canvas.focused');
							if(cc.length){
							//	var x = parseInt($('.canvas-cursor.cursor-self').css('left')),
							//		y = parseInt($('.canvas-cursor.cursor-self').css('top'))
								var x = Brush.mx, y = Brush.my;	

								var px = cc[0].getContext('2d').getImageData(x, y, 1, 1).data;
								var r = ('00' + px[0].toString(16)).slice(-2),
									g = ('00' + px[1].toString(16)).slice(-2),
									b = ('00' + px[2].toString(16)).slice(-2),
									a = ('00' + px[3].toString(16)).slice(-2)
								var hex = "#" + ("00000000" + (r+g+b+a)).slice(-8);
								
								if(hex != Brush.brush().color){
									Brush.color(hex).update()
									updateInterfaceHex(hex)
									writeDefaults();
								}
							}
							break;
						}
						case 32:
						{
							return !(Brush.tmoving = true)
						}
						case 9:
						{
							Brush.tabdown = true;
							return false;
						}
						case 65: // a
						{
							overlayShow(false)
							if(Brush.tabdown){
								ignoreGui = true
								removeCanvasFrame()
							}
							else return advanceCanvas(null, -1)
						}
						case 83: // s
						{
							overlayShow(false)
							if(Brush.tabdown){
								ignoreGui = true
								addCanvasFrame()
							}
							else return advanceCanvas(null, 1)
						}
						case 68: // d
						{
							overlayShow(false)
							if(Brush.tabdown){
								ignoreGui = true
							}
							else return advanceCanvas(-1)
						}
						case 70: // f
						{
							overlayShow(false)
							if(Brush.tabdown){
								ignoreGui = true
							}
							else return advanceCanvas(1)
						}
				}
			} else if(e == 'keyup'){
				if(data.key == 82){
					addPaletteEntryRgb(getColorSliderRgb())
					$('.canvas-cursor.cursor-self').removeClass('pick-color')
				}
				if(data.key == 32){
					Brush.tmoving = false;
					return false;
				} else if(data.key == 9){
					Brush.tabdown = false;
				}
			}
		});
		updateInfo()
		updateFrameinfoSlow()
	});
	
	
	$('.gui .color-spinner').mouseout(function(e){
		clearTimeout(overlayTimeout);
		overlayTimeout = setTimeout(overlayGone, 3000);
	}).mouseover(function(e){
		clearTimeout(overlayTimeout);
	});
	
	$('.qstatus-message').mousedown(function(e){
		
		if(!$('.gui.visible').length){
			overlayShow(true)
		}
	})
	
	$('.qstatus-brush, .qstatus-settings').click(function(e){
		var toq = null
		if(!$('.qstatus-panel').has(e.target).length){
			var t = $(this)
			$('.qstatus-brush, .qstatus-settings').removeClass('panel-open')
			
			t.toggleClass('panel-open')
		}
		
	})
	
	$('.setting-quit-btn').click(function(){
		if($(this).hasClass('confirm')){
			initParupaint()
		} else {
			$(this).addClass('confirm')
			$(this).mouseout(function(){
				$(this).removeClass('confirm').unbind('mouseout')
			})
		}
	})
	
	$('.flayer-list').bind('mousewheel', function(e){ this.scrollLeft -= (e.originalEvent.wheelDelta) }).click(function(e){
		if($('.flayer-info-layer').has($(e.target)).length){
			// is a frame from one of the layers?
			var f = parseInt($(e.target).data('frame')),
				l = parseInt($(e.target).parent().data('layer'))
			console.log('click on', l, f)
			focusCanvas(l, f)
		}
	})
	
	
	$('html').mousedown(function(e){
		
		var qs = $('.qstatus-brush, .qstatus-settings')
		if(!qs.has($(e.target)).length && !$(e.target).is(qs)){
			if(qs.hasClass('panel-open')){
				return qs.removeClass('panel-open')
			}
		}
		if(!$('#mouse-pool').has($(e.target)).length && !$('.gui, .qstatus').has($(e.target)).length){
			if($('.gui.visible').length) overlayShow(false)
			else if($('.qstatus.visible').length) overlayGone()
			else{
				overlayShow(false)
			}
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

