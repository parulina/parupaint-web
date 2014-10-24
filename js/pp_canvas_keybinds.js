
var mouseMoveTimer = null
var ignoreGui = false;

var updateCallbacks = function(){
	
	$('#mouse-pool').sevent(function(e, data){
		// the kind of stuff that happens when the canvas
		// is focused and _should_ be focused (drawing, etc...)
		if(e == 'mousemove'){	

			var drawing = (data.button == 1);

			//todo: store with zoom offset
			Brush.mx = data.x;
			Brush.my = data.y;
			var ow = $('canvas.focused').get(0).width,
				oh = $('canvas.focused').get(0).height,
				nw = $('.canvas-workarea').width(),
				nh = $('.canvas-workarea').height()
			
			
			var cursor = $('.canvas-cursor.cursor-self');
			if(cursor.length){
				var left = parseInt(cursor.css('left')), top = parseInt(cursor.css('top'));
				var dx = (Brush.mx - left), dy = (Brush.my - top);
				var dist = Math.sqrt(dx*dx + dy*dy)
				if(dist > (drawing ? 2 : 15)){
					cursor.css({left: data.x, top:data.y});
					if(!drawing){
						if(roomConnection){
							roomConnection.socket.emit('d', {x: ((data.x/nw)*ow), y: ((data.y)/nh)*oh, d: false})
						}
					}
				}
				
				
				if(mouseMoveTimer) clearTimeout(mouseMoveTimer)
				mouseMoveTimer = setTimeout(function(){
					cursor.css({left: data.x, top:data.y});
				}, 800)
			}
			if(tabletConnection && tabletConnection.e != Brush.cbrush && tabletConnection.autoswitch){
				Brush.brush(parseInt(tabletConnection.e))
				Brush.update()
				updateInterfaceHex(Brush.brush().color)
			}
			var moving = (Brush.tmoving || data.button == Brush.bmove);
			if(moving){
				var b = $('body');
				b.scrollLeft(b.scrollLeft() - data.sx);
				b.scrollTop(b.scrollTop() - data.sy);
			}
			if(drawing){

				var nx1 = ((data.x - data.cx)/nw)*ow;
				var ny1 = ((data.y - data.cy)/nh)*oh;
				var nx2 = ((data.x)/nw)*ow;
				var ny2 = ((data.y)/nh)*oh;

				var s = (Brush.brush().size);
				var c = (Brush.brush().color);
				if(tabletConnection){
					if(tabletConnection.focus){
						s *= tabletConnection.p

						var ss = Math.round(tabletConnection.p*10)/10
						var pp = $('.canvas-cursor.cursor-self .cursor-pressure-size')
						if(pp.data('ts') != ss){
							pp.css('transform', 'scale('+tabletConnection.p+')').data('ts', ss);
						}

					}
				}
				if(roomConnection){
					roomConnection.socket.emit('d', {x: nx2, y: ny2, s: s, c: c, d: true})
				}
				drawCanvasLine(null, nx1, ny1, nx2, ny2, c, s)
			}
		}else if(e == 'mousedown'){
			
			if(data.button == Brush.beraser){
				var newbrush = Brush.cbrush == 0 ? 1 : 0;
				Brush.brush(newbrush)
				Brush.update()
				updateInterfaceHex(Brush.brush().color)
				tabletConnection.autoswitch = false

			}
			else if(data.button == 1){
				$('.canvas-cursor.cursor-self').addClass('drawing')
				if(roomConnection){
					roomConnection.socket.emit('d', {d: false, l: $('canvas.focused').data('layer'), f: $('canvas.focused').data('frame')})
				}
			}
		}else if(e == 'mouseup'){
			if(data.button == 1){
				$('.canvas-cursor.cursor-self').removeClass('drawing')
				// fixme: should fix this...
				// saveCanvasLocal(room);
			}
		}
	}).bind('contextmenu', function(e) {
			return false;
	})
	$('html').sevent(function(e, data){
		// global keys
		// todo: ignore :focus on any global inputs
		
		
		
		
		if(e == 'mousemove'){	

			if(Brush.tbrushzoom || Brush.tzoomcanvas){
				if(Brush.tzoomstart == null) {
					Brush.tzoomstart = (data.yclient)
					Brush.ttsize = (Brush.tzoomcanvas ? ($('.canvas-workarea').data('zoom') || 1.0) : Brush.brush().size)
				}
				var step = 5 * (Brush.ttsize<5 ? 0.5 : 1);
				var diff = 1+((Brush.tzoomstart - data.yclient)*2 / $(this).height());
				var res = 1+(Brush.ttsize * (diff > 0.00000000 ? diff : 1))*diff
				var rres = Math.floor((res - Brush.ttsize) / step);
				var rs = (Brush.ttsize + rres * step);
				
				if(Brush.tbrushzoom){
					if(rs != Brush.brush().size && rs <= 128 && rs >= 1) {
						if(rs < 0) rs = 0;
						else if (rs > 128) rs = 128;
						Brush.size(rs).update()

					}	
				}
				// don't know how to make this work.
				// the actual canvas-workarea changes when i set the zoom, so the diff
				// gets all messed up since it uses its' height for calculation.

				else if(Brush.tzoomcanvas){
					var rrr = (Brush.ttsize * (diff > 0.00000000 ? diff : 1))
					var ic = (Math.round((rrr) * 50)/50),
						zz = $('.canvas-workarea').data('zoom') || 1.0
					//console.log('->', res, '=', Brush.ttsize, '*', diff)
					if(ic != zz){
						setZoom(ic)
					}
				}

			}
		} else if(e == 'mousedown'){
			
			if(data.button == Brush.bmove){
				$('#mouse-pool').focus()
				return false;
			}
			if($(data.target).is('html')){
				var qs = $('.qstatus-brush, .qstatus-settings')
				if(!qs.has($(e.target)).length && !$(e.target).is(qs)){
					if(qs.hasClass('panel-open')){
						return qs.removeClass('panel-open')
					}
				}
				if(!$('#mouse-pool').has($(e.target)).length && !$('.gui, .qstatus').has($(e.target)).length){
					if($('.gui.visible').length) hideOverlay(true)
					else{
						showOverlay()
					}
				}
			}
			
		} else if(e == 'mousewheel'){
			if($('.overlay').has($(data.target)).length) return false;
			if(!Brush.tmoving){
				//while moving canvas
				var z = $('.canvas-workarea').data('zoom') || 1.0;
				z *= (data.scroll > 0 ? 1.2 : 0.8)
				if(z < 0.1) z = 0.1
				else if(z > 6) z = 6

				setZoom(z)

			} else {
				var a = data.scroll > 0 ? 2 : 0.5;
				var cursor = $('.canvas-cursor.cursor-self')
				var s = parseInt(cursor.data('size'))
				s *= a;
				if(s < 1) s = 1;
				if(s > 256) s = 256;
				Brush.size(s).update()
				if(roomConnection){
					roomConnection.socket.emit('d', {s: s})
				}
			}
			writeDefaults()

			return false;
			
			
			
			
			
		} else if(e == 'keydown'){
			console.log(data.key)
			if($('input:focus, textarea:focus').length) return true;

			switch(data.key){
					
					
					case 84:
					{
						$('body').toggleClass('canvas-preview')
						break;
					}
					case 69: // e
					{

						var newbrush = Brush.cbrush == 0 ? 1 : 0;
						Brush.brush(newbrush)
						Brush.update()
						updateInterfaceHex(Brush.brush().color)
						tabletConnection.autoswitch = false
						break;
					}
					case 27: //esc
					{
						return hideOverlay(true)
					}
					case 82: // r
					{
						if(!$('.canvas-cursor.cursor-self').hasClass('pick-color')){
							$('.canvas-cursor.cursor-self').addClass('pick-color')
						}
						var cc = $('canvas.focused');
						if(cc.length){
							var x = Brush.mx, y = Brush.my;	

							var px = cc.get(0).getContext('2d').getImageData(x, y, 1, 1).data;
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
						if(data.ctrl) 			return !(Brush.tzoomcanvas = true)
						else if(data.shift) 	return !(Brush.tbrushzoom = true)
						else					return !(Brush.tmoving = true)
					}
					case 9:
					{
						Brush.tabdown = true;
						return false;
					}
					case 67: // c
					{
						if(document.commandDispatcher){ //firefox?
							var image = new Image()
							image.onload = function(){
								var node = document.popupNode, 
									command = 'cmd_copyImageContents'
								document.popupNode = image
								var controller = document.commandDispatcher.getControllerForCommand(command)
								if(controller && controller.isCommandEnabled(command)){
									controller.doCommand(command)
								}
								document.popupNode = node
							}
							image.src=$('canvas.focused').get(0).toDataURL()
						}
					}
					case 67: // v
					{
						break;
					}
					case 65: // a
					{
						if(Brush.tabdown){
							ignoreGui = true
							var f = $('canvas.focused').data('frame'),
								l = $('canvas.focused').data('layer')
							removeCanvasFrame()
							if(!focusCanvas(l, f)) focusCanvas(l, f-1)
							return true

						}
						else return advanceCanvas(null, -1)
					}
					case 83: // s
					{
						if(Brush.tabdown){
							ignoreGui = true
							var f = $('canvas.focused').data('frame'),
								l = $('canvas.focused').data('layer')
							addCanvasFrame()
							return focusCanvas(l, f+1)
						}
						else return advanceCanvas(null, 1)
					}
					case 68: // d
					{
						if(Brush.tabdown){
							ignoreGui = true
							var l = $('canvas.focused').data('layer'),
								f1 = $('.canvas-pool canvas[data-layer='+(l)+']').length-1,
								f2 = $('.canvas-pool canvas[data-layer='+(l-1)+']').length-1
							removeCanvasLayer()
							if(!focusCanvas(l, f1)) focusCanvas(l-1, f2)

							return true;
						}
						else return advanceCanvas(-1)
					}
					case 70: // f
					{
						if(Brush.tabdown){
							ignoreGui = true
							var f = $('canvas.focused').data('frame'),
								l = $('canvas.focused').data('layer')
							addCanvasLayer()
							return focusCanvas(l, 0)
						}
						else return advanceCanvas(1)
					}
					case 46: // del
					{
						if(data.ctrl){
							clearCanvasFrame(Brush.brush().color)
						}else{
							clearCanvasFrame('transparent')
						}
					}
			}
		} else if(e == 'keyup'){
			if(data.key == 9)
			{
				Brush.tabdown = false;
				if(!ignoreGui){

					if(data.shift){
						hideOverlay(true)
					}else{
						showOverlay()
					}
					return false;
				}
				ignoreGui = false
			}
			if(data.key == 32){
				Brush.tzoomcanvas = Brush.tbrushzoom = Brush.tmoving = false
				Brush.tzoomstart = null
				return false;
			}
			
			
			
			// below is for normal keycodes for inputs
			if($('input:focus, textarea:focus').length) return true;
			
			if(data.key == 82){
				addPaletteEntryRgb(getColorSliderRgb())
				$('.canvas-cursor.cursor-self').removeClass('pick-color')
			}
		}
		else if(e == 'paste'){
			var cd = data.clipdata;
			var file = cd.items[0].getAsFile()
			console.log(file)
			
			/*
			var reader = new FileReader();
			reader.onload = function(evt) {
				return options.callback.call(element, {
					dataURL: evt.target.result,
					event: evt,
					file: file,
					name: file.name
				});
			};
			reader.readAsDataURL(file);
			*/
			return false;
		}
	})
}









