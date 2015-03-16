
var canvasEvents = function(r, rs){
	var mouseMoveTimer = null, ignoreGui = false;
	console.log('Creating canvas events')

	$('#mouse-pool').sevent(function(e, data){
		// the kind of stuff that happens when the canvas
		// is focused and _should_ be focused (drawing, etc...)
		if(e == 'mousemove' && data.target.tagName == 'CANVAS'){
			
			var drawing = (data.button == 1)

			//todo: store with zoom offset
			var ow = $('canvas.focused').get(0).width,
				oh = $('canvas.focused').get(0).height,
				nw = $('.canvas-workarea').width(),
				nh = $('.canvas-workarea').height()
			
			Brush.mx = (data.x/nw)*ow;
			Brush.my = (data.y/nh)*oh;
			
			
			var cursor = $('.canvas-cursor.cursor-self');
			if(cursor.length){
				var left = parseInt(cursor.css('left')), top = parseInt(cursor.css('top'));
				var dx = (data.x - left), dy = (data.y - top);
				var dist = Math.sqrt(dx*dx + dy*dy)
                
                var color = cursor.hasClass('pick-color');
                
				if(color || dist > (drawing ? 2 : 15)){
					cursor.css({left: data.x, top:data.y});
					if(!drawing && !color){
						if(isConnected()){
							rs.socket.emit('d', {x: Brush.mx, y: Brush.my, d: false})
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
				var b = $(window);
				b.scrollLeft(b.scrollLeft() - data.sx);
				b.scrollTop(b.scrollTop() - data.sy);
			}
			if(drawing){
                var plugin = document.getElementById('wacomPlugin');
                
				var nx1 = ((data.x - data.cx)/nw)*ow;
				var ny1 = ((data.y - data.cy)/nh)*oh;

				var s = (Brush.brush().size);
				var c = (Brush.brush().color);
				var ns = null;
				
				
				// size
				if(tabletConnection && tabletConnection.connections){
					if(tabletConnection.focus){
						ns = tabletConnection.p;
						console.log('tabletConnection', ns)
					}
				}
                else if(plugin && plugin.penAPI){
                    if(plugin.penAPI.pointerType != 0){
                        ns = plugin.penAPI.pressure;
                    	//console.log('plugin.penAPI.pressure', ns)
                    }
                }
                else if(data.mozPressure){
                    console.log('mozPressure', ns)
                    ns = data.mozPressure;
                }
				
				
				
				
				var pp = cursor.children('.cursor-pressure-size');
				if(ns != null){
					s *= ns;

					var ss = Math.round(ns * 10)/10;
					if(pp.data('ts') != ss){
						pp.css('transform', 'scale('+ ns +')').data('ts', ss);
					}
				} else {
					//mouse
					if(pp.attr('style')){
						pp.removeAttr('style');
					}
				}
                
                
                if(s != 0.0){
					if(isConnected()){
						rs.socket.emit('d', {x: Brush.mx, y: Brush.my, s: s, c: c, d: true})
					}
					drawCanvasLine(null, nx1, ny1, Brush.mx, Brush.my, c, s)	
				}
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
				if(isConnected()){
					rs.socket.emit('d', {d: false, l: $('canvas.focused').data('layer'), f: $('canvas.focused').data('frame')})
				}
			}
		}else if(e == 'mouseup'){
			if(data.button == 1){
				$('.canvas-cursor.cursor-self').removeClass('drawing')
				// fixme: should fix this...
				// saveCanvasLocal(room);
			}
		}else if(e == 'mouseout'){
			if(isConnected()){
				rs.socket.emit('d', {x: Brush.mx, y: Brush.my, s: s, c: c, d: false})
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
			temp1 = data.target
			if(!$('.overlay').has(data.target).length && data.button == 1){
				var qs = $('.qstatus-brush, .qstatus-settings')
				if(!qs.has($(e.target)).length && !$(e.target).is(qs)){
					if(qs.hasClass('panel-open')){
						return qs.removeClass('panel-open')
					}
				}
				if($(data.target).is('html') && !$('#mouse-pool').has($(e.target)).length && !$('.gui, .qstatus').has($(e.target)).length){
					if($('.gui.visible').length) hideOverlay(true)
					else{
						showOverlay(2000)
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
				if(isConnected()){
					rs.socket.emit('d', {s: s})
				}
			}
			writeDefaults()

			return false;
			
			
			
			
			
		} else if(e == 'keydown'){
			if($('input:focus, textarea:focus').length) return true;
			console.log(data.key)

			switch(data.key){
					
					case 49: // 1
					case 50:
					case 51:
					case 52:
					case 53: // 5
					{
						var s = (data.key - 48) * 2;
						Brush.size(s).update()
						if(isConnected()){
							rs.socket.emit('d', {s: s})
						}
						break;
					}
					
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
						if(data.shift && data.ctrl){
							
						}
						else if(data.shift){
							if(isConnected()){
								ROOM.roomSocket.reload(function(){
									updateInfo()
								})
							}
						}else{

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
				if($('input:focus').length) return true;
				Brush.tabdown = false;
				if(!ignoreGui){

					if(data.shift){
						hideOverlay(true)
					}else{
						showOverlay(2000)
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
			
			
//				var reader = new FileReader();
//				reader.onload = function(evt) {
//					return options.callback.call(element, {
//						dataURL: evt.target.result,
//						event: evt,
//						file: file,
//						name: file.name
//					});
//				};
//				reader.readAsDataURL(file);
			
			return false;
		}
	})

}








