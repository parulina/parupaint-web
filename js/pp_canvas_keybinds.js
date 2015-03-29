
var canvasEvents = function(room, net){
	var mouseMoveTimer = null;

	$('#mouse-pool').sevent(function(e, data){
		// the kind of stuff that happens when the canvas
		// is focused and _should_ be focused (drawing, etc...)
		if(e == 'mousemove' && data.target.tagName == 'CANVAS'){
			// first...
			
			// let's check if we're moving the canvas. don't move the cursor
			// if we are.
			if(Brush.tmoving || data.button == Brush.bmove){
				var b = $(window);
				
				// move the scrollbar with the deltas (sx, sy)
				b.scrollLeft(b.scrollLeft() - data.sx);
				b.scrollTop(b.scrollTop() - data.sy);
				
				return true;
			}
			
			var drawing = (data.button == 1);
			var plugin = document.getElementById('wacomPlugin');
			
			// original dimensions and new (zoomed) dimensions
			var ow = $('canvas.focused').get(0).width,
				oh = $('canvas.focused').get(0).height,
				nw = $('.canvas-workarea').width(),
				nh = $('.canvas-workarea').height();
			
			// fix and get brush vars
			Brush.mx = (data.x/nw)*ow;
			Brush.my = (data.y/nh)*oh;
			var s = (Brush.size());
			var c = (Brush.color());
			
			
			
			var cursor = $('.canvas-cursor.cursor-self');
			if(cursor.length){
				
				var left = parseInt(cursor.css('left')), 
					top = parseInt(cursor.css('top'));
				
				var dx = (data.x - left), 
					dy = (data.y - top);
				
				var dist = Math.sqrt(dx*dx + dy*dy);
                
                var color = cursor.hasClass('pick-color');
                
				// use a higher distance when not drawing to skip updating more
				if(color || dist > (drawing ? 2 : 15)){
					cursor.css({
						left: data.x, 
						top:data.y
					});
					if(!drawing && !color){
						if(isConnected()){
							net.emit('draw', {
								x: Brush.mx, 
								y: Brush.my, 
								s: s, 
								c: c, 
								d: false
							});
						}
					}
					if(mouseMoveTimer) clearTimeout(mouseMoveTimer)
					mouseMoveTimer = setTimeout(function(){
						cursor.css({left: data.x, top:data.y});
					}, 800);
				}
			}
			
			
			var tabletSwitch = function(e) {
				Brush.switchToBrush(er);
				guiControl.updateFromBrush(Brush);
				
				if(isConnected()){
					net.emit('draw', {
						x: Brush.mx, 
						y: Brush.my,
						s: s,
						c: c,
						d: false
					});
				}
			};
			// might as well cache the pressure while we're at it.
			var tabletPressure = null;
			
			// switch brush if tablet pen has flipped
			if(tabletConnection && tabletConnection.connections){
				
				// check if different and is allowed to switch
				if(tabletConnection.e != Brush.cbrush && 
				tabletConnection.autoswitch){
					// switch it
					tabletSwitch(parseInt(tabletConnection.e));
				}
				tabletPressure = tabletConnection.p;
			}
			if(plugin && plugin.penAPI){
				// bool to int
			    var er = plugin.penAPI.isEraser ? 1 : 0;
				
			    if(tabletConnection.autoswitch &&
				Brush.cbrush != er) {
					tabletSwitch(er)
			    }
				if(plugin.penAPI.pointerType != 0) {
					tabletPressure = plugin.penAPI.pressure;
				}
			}
		
			
			// we might actually be drawing right now.
			if(drawing){
                
				// get the.. change?
				var nx1 = ((data.x - data.cx)/nw)*ow;
				var ny1 = ((data.y - data.cy)/nh)*oh;

				// pressure
				var ns = null;
				
				if(tabletPressure != null) {
					ns = tabletPressure;
				} else if(data.mozPressure){
					// just test mozPressure, doubtful if it works
                    ns = data.mozPressure;
                }
				
				if(ns != null){
					var ps = cursor.children('.cursor-pressure-size');
					if(ps.length) {
						// multiply the caches size so it affects everything
						s *= ns;
						
						var ss = Math.round(ns * 10)/10;
						if(ps.data('ts') != ss){
							ps.css({
								'transform': 'scale('+ ns +') translate(-50%, -50%)'
							}).data('ts', ss);
						}
					}
				}
                
                
                if(s != 0.0){
					if(isConnected()){
						net.emit('draw', {
							x: Brush.mx, 
							y: Brush.my, 
							s: s, 
							c: c, 
							d: true
						});
					} 
					if(!room.brushStrokeRoundtrip) {
						drawCanvasLine(null, nx1, ny1, 
									   Brush.mx, Brush.my, c, s);	
					}
				}
			}
		}else if(e == 'mousedown'){
			
			var plugin = document.getElementById('wacomPlugin');
			if(plugin && plugin.penAPI){
				// ???
				// no idea why i added this here
			}
			
			if(data.button == Brush.beraser){
				var newbrush = (Brush.cbrush == 0 ? 1 : 0);
				Brush.switchToBrush(newbrush);
				guiControl.updateFromBrush(Brush);
				
				tabletConnection.autoswitch = false;
				if(isConnected()){
					net.emit('draw', {
						x: Brush.mx, 
						y: Brush.my, 
						s: Brush.size(), 
						c: Brush.color(), 
						d: false
					});
				}
			}
			else if(data.button == 1){
				if(isConnected()){
					net.emit('lf', {
						l: $('canvas.focused').data('layer'), 
						f: $('canvas.focused').data('frame')
					});
				}
			}
		}else if(e == 'mouseup'){
			//TODO local canvas save?
			
			var cursor = $('.canvas-cursor.cursor-self');
			if(data.button == 1){
				var ps = cursor.children('.cursor-pressure-size');
				if(ps.length) {
					ps.removeAttr('style');
				}
			}
		}else if(e == 'mouseout'){
			if(isConnected()){
				net.emit('draw', {x: Brush.mx, y: Brush.my, s: Brush.brush().size, c: Brush.brush().color, d: false})
			}
		}
	}).bind('contextmenu', function(e) {
			return false;
	});
	
	// now for everything else
	// global keys
	$('html').sevent(function(e, data){
		
		if(e == 'mousemove'){
			// zoom
			// maybe clean this up someday..
			// TODO: and add zooming in to where the cursor is.
			if(Brush.tbrushzoom || Brush.tzoomcanvas){
				if(Brush.tzoomstart == null) {
					Brush.tzoomstart = (data.yclient)
					Brush.ttsize = (Brush.tzoomcanvas ? ($('.canvas-workarea').data('zoom') || 1.0) : Brush.brush().size)
				}
				var step = 5 * (Brush.ttsize<5 ? 0.5 : 1);
				var diff = 1+((Brush.tzoomstart - data.yclient)*2 / $(this).height());
				var res = 1+(Brush.ttsize * (diff > 0.00000000 ? diff : 1))*diff
				var rres = Math.floor((res - Brush.ttsize) / step);
				var ras = (Brush.ttsize + rres * step);
				
				if(Brush.tbrushzoom){
					if(ras != Brush.brush().size && ras <= 128 && ras >= 1) {
						if(ras < 0) ras = 0;
						else if (ras > 128) ras = 128;
						Brush.size(ras).update()

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
		
			if(data.button == 3) {
				// disable context menu
				return false;
			} else if(data.button == 1) {
				var target = $(data.target)
				if(!$('.overlay').has(target).length) {
					// okay, it's not the overlay thing.
					
					// check if the setting dialogs are open...
					var qs = $('.qstatus-brush, .qstatus-settings');
					if(!qs.has($(target)).length && !$(target).is(qs)){
						if(qs.hasClass('panel-open')){
							return qs.removeClass('panel-open');
						}
					}
					
					// nope, okay, toggle the normal ui.
					var p = $('#mouse-pool');
					// is it not the canvases, and is it not the ui itself?
					if(!p.has(target).length && !p.is(target) && !$('.gui').has(target).length){
						guiControl.toggle(true);
					}
				}
			}
			writeDefaults();
		} else if(e == 'mousewheel'){
			if($('.overlay').has($(data.target)).length) return false;
			
			// it makes sense to have the zoom work when you're moving with space.
			// space = canvas handle
			if(Brush.tmoving){
				//while moving canvas
				var z = $('.canvas-workarea').data('zoom') || 1.0;
				z *= (data.scroll > 0 ? 1.2 : 0.8);
				if(z < 0.1) z = 0.1;
				else if(z > 6) z = 6;

				setZoom(z);

			} else {
				var a = data.scroll > 0 ? 2 : 0.5;
				var cursor = $('.canvas-cursor.cursor-self');
				if(cursor.length){
					var s = parseInt(cursor.data('size'));
					s *= a;
					if(s < 1) s = 1;
					if(s > 256) s = 256;
					Brush.size(s).update();
					if(isConnected()){
						net.emit('draw', {
							x: Brush.mx, 
							y: Brush.my, 
							s: s, 
							c: Brush.color(), 
							d: false
						});
					}	
				}
			}
			writeDefaults();
			return false;
			
		// keybinds
		} else if(e == 'keydown'){
			if($('input:focus, textarea:focus').length) return true;

			switch(data.key){
					
				case 49: // 1
				case 50:
				case 51:
				case 52:
				case 53: // 5
				{
					var k = (data.key - 48)-1;
					var sizes = [
						1,
						3,
						6,
						16,
						64
					];
					Brush.size(sizes[k]).update()
					if(isConnected()){
						net.emit('draw', {
							x: Brush.mx, 
							y: Brush.my, 
							s: s, 
							c: Brush.color(),
							d: false
						});
					}
					break;
				}
				case 84:
				{
					$('body').toggleClass('canvas-preview');
					break;
				}
				case 69: // e
				{

					var newbrush = Brush.cbrush == 0 ? 1 : 0;
					Brush.switchToBrush(newbrush);
					guiControl.updateFromBrush(Brush);

					// make sure the tablet doesn't immediately
					// switch back to brush mode
					tabletConnection.autoswitch = false;
					break;
				}
				case 27: //esc
				{
					guiControl.hide();
					break;
				}
				case 82: // r
				{
					if(data.shift && data.ctrl){

					}
					else if(data.shift){
						if(isConnected()){
							room.socketReload(function(){
								updateInfo();
							});
						}
					} else {
						// maybe should do this in a better way someday.
						// FIXME
						var me = $('.canvas-cursor.cursor-self');
						if(!me.hasClass('pick-color')){
							me.addClass('pick-color');
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
								Brush.color(hex)
								guiControl.updateFromBrush(Brush);
								me.css('background-color', 
									'rgba('+
										px[0]+','+
										px[1]+','+
										px[2]+','+
										px[3]/255 + ')');
								writeDefaults();
							}
						}
					}
					break;
				}
				case 32: // space
				{
							if(data.ctrl) 	return !(Brush.tzoomcanvas = true)
					else 	if(data.shift) 	return !(Brush.tbrushzoom = true)
					else					return !(Brush.tmoving = true)
				}
				case 9: // tab
				{
					if($('input:focus').length) return true;
					if(guiControl.isVisible()){
						if(data.shift) {
							guiControl.hide();
						} else {
							guiControl.show(true); // show it permanently if tapped twice
						}
					} else {
						if(!data.shift) guiControl.show(false);
					}

					Brush.tabdown = true;
					return false;
				}
				case 67: // c
				{
					// TODO: implement copypasting thing
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
				case 83: // s
				{
					var sd = (data.key == 83);
					if(Brush.tabdown){
						var l = $('canvas.focused').data('layer'),
							f = $('canvas.focused').data('frame');
						if(!isConnected()){
							if(sd) {
								addCanvasFrame();
								return focusCanvas(l, f+1);
							} else {
								removeCanvasFrame();
								if(!focusCanvas(l, f)) focusCanvas(l, f-1);
							}
						} else {
							var fc = (sd ? 1 : -1);
							RoomListSocket.emit('lf', {l: l, f: f, fc: fc});
						}
						return true;

					}
					else {
						return advanceCanvas(null, sd ? 1 : -1);
					}
					break;
				}
				case 68: // d
				case 70: // f
				{
						var fd = (data.key == 70);
					if(Brush.tabdown){
						var l = $('canvas.focused').data('layer'),
							f = $('canvas.focused').data('frame'),
							f1 = $('.canvas-pool canvas[data-layer='+(l)+']').length-1,
							f2 = $('.canvas-pool canvas[data-layer='+(l-1)+']').length-1;

						if(!isConnected()) {
							if(fd) {
								addCanvasLayer();
								return focusCanvas(l, 0)
							} else {
								removeCanvasLayer();
								if(!focusCanvas(l, f1)) focusCanvas(l-1, f2);
							}
						} else {
							var lc = (fd ? 1 : -1);
							RoomListSocket.emit('lf', {l: l, f: f, lc: lc});
						}

						return true;
					}
					else {

					   return advanceCanvas(fd ? 1 : -1);
					}
					break;
				}
				case 46: // del
				{
					if(isConnected()){
						var l = $('canvas.focused').data('layer'),
							f = $('canvas.focused').data('frame');
						
						// send net packet
						if(data.ctrl) {
							RoomListSocket.emit('clr', {l: l, f: f, c: Brush.color()});
						} else {
							RoomListSocket.emit('clr', {l: l, f: f});
						}
						
					} else {
						if(data.ctrl){
							clearCanvasFrame(Brush.color());
						}else{
							clearCanvasFrame('transparent');
						}	
					}
					break;
				}
			} // end switch
			
		} else if(e == 'keyup'){
			switch(data.key){
					case 9: // tab
					{
						Brush.tabdown = false;
						return false;
					}
					case 32: // space
					{
						Brush.tzoomcanvas = Brush.tbrushzoom = Brush.tmoving = false;
						Brush.tzoomstart = null;
						return false;
					}
			}
			
			// below is for normal keycodes for inputs
			if($('input:focus, textarea:focus').length) return true;
			
			switch(data.key) {
					case 82: // r
					{
						//FIXME ???
						addPaletteEntryRgb(getColorSliderRgb());
						$('.canvas-cursor.cursor-self').removeClass('pick-color');
						break;
					}
			}
		}
		// ... i'll fix this later.
		/*
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
		*/
	})

}









