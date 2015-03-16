// this is for network code



var roomConnection = function(roomObj){
	if(!RoomListSocket) return false;
	
	
	
	
	//disconnect - $('.canvas-cursor').not('.cursor-self').remove()
	
	this.emit = function(str, d) {
		if(RoomListSocket){
			RoomListSocket.emit(str, d);
		}	
	};
	var cleanup = function(){
		$('.canvas-cursor').not('.cursor-self').remove()
		$('.cursor-self').removeClass('admin');
		$('body').removeClass('is-private');
		
	}
	RoomListSocket.on('leave', cleanup);
	RoomListSocket.on('join', function(data){
		if(!data.success) {
			initParupaint('', 'Wrong password.')
			
		}
	})
	
	RoomListSocket.on('canvas', function(d){
		console.log('canvas', d)
		if(d.layers != undefined){ // create new
			initCanvas(d.width, d.height, d.layers)
		} else {
			initCanvas(d.width, d.height)
		}
		
		
		roomObj.socketReload(function(){
			updateFrameinfoSlow()
			updateInfo()
		})
	});
	
	RoomListSocket.on('img', function(d){
		var l = parseInt(d.l),
			f = parseInt(d.f),
			decodedData = window.atob(d.data),
			binData = new Uint8Array(decodedData.split('').map(function(x){ return x.charCodeAt(0); })),
			data = pako.inflate(binData),
			iw = parseInt(d.w),
			ih = parseInt(d.h),
			bpp = 4;
		
		var e = $('#flayer-' + l + '-' + f);
		
		if(e.length) {
			var ctx = e.get(0).getContext('2d');
			


			var cc = ctx.createImageData(iw, ih);
			for (var i = 0, len = cc.data.length; i < len; i += 4) {
				cc.data[i] = data[i+2];
				cc.data[i+1] = data[i+1];
				cc.data[i+2] = data[i];
				cc.data[i+3] = data[i+3];
			}
			ctx.putImageData(cc, 0, 0)
		}
	});
	
	// on peer disconnect/connect
	RoomListSocket.on('peer', function(d){
		console.log('Peer connected: ' + d.id, d)
		
		var f = $('#' + d.id)
		if(d.disconnect && f.length) {
			f.remove()
		} else if(!d.disconnect) {
			var e = $('<div/>', {
				class: 'canvas-cursor',
				id:d.id,
				'data-name': d.name 
			}).css({
				left: d.brushdata.X,	
				top: d.brushdata.Y
			}).data({
				'x': d.brushdata.X,	
				'y': d.brushdata.Y,
				'layer': d.brushdata.Layer,
				'frame': d.brushdata.Frame
			})
			Brush.size(d.brushdata.Size, e)
			//TODO set drawing/etc
			$('#mouse-pool').append(e)		
		}
	});
	
	RoomListSocket.on('id', function(id){
		if(typeof id == "string"){
			console.log("You're ID " + id);
			$('.cursor-self').attr('id', id);
		}
	})
	RoomListSocket.on('lf', function(d){
		var e = $('.canvas-cursor#' + d.id)
		if(!e.length) return;
		
		var l = parseInt(d.l),
			f = parseInt(d.f);
		e.data({
			'layer': l,
			'frame': f
		})
	})
	RoomListSocket.on('rs', function(d){
		
		$('.cursor-self').removeClass('admin');
		$('body').removeClass('is-private');
		
		if(typeof d.admin != "undefined") {
			if(d.admin == $('.cursor-self').attr('id')) {
				// is admin
				console.log("You're admin.");
				$('.cursor-self').addClass('admin');
			}
		}
		if(typeof d.private != "undefined"){
			$('body').toggleClass('is-private', d.private);
			console.log('Switching private to ' + d.private);
		}
		
		
		updateInfo()
		
	})
	
	RoomListSocket.on('draw', function(d){
		
		var x = d.xo,
			y = d.yo,
			l = d.l,
			f = d.f,
			xx = d.x, // net x
			yy = d.y, // net y
			ss = d.s, // net size
			cc = d.c, // net color
			dd = d.d; // net drawing
		
		
		if(typeof d.id != "undefined") {
			
			var e = $('.canvas-cursor#' + d.id)
			if(!e.length) return;
			var me = e.hasClass('cursor-self');

			var ow = $('canvas.focused').get(0).width,
				oh = $('canvas.focused').get(0).height,
				nw = $('.canvas-workarea').width(),
				nh = $('.canvas-workarea').height();
			
			var x = e.data('x'),
				y = e.data('y'),
				l = e.data('layer'),
				f = e.data('frame');



			if(!me) {
				if(xx != undefined) e.css('left', (xx/oh)*nh).data('x', xx);
				if(yy != undefined) e.css('top', (yy/ow)*nw).data('y', yy);
				if(ss != undefined) Brush.size(ss, e)
				if(cc != undefined) Brush.color(cc, e)

			} else {
				if(xx != undefined) e.data('x', xx);
				if(yy != undefined) e.data('y', yy);
			}

			if(dd != undefined && dd != e.hasClass('drawing')){
				if(dd) { 
					x = xx, y = yy
					console.log('Drawing, resetting')
				} // v0v
				e.toggleClass('drawing', dd)
			}
			if((!me && dd) && 
			   l != undefined && 
			   f != undefined && 
			   xx != undefined && 
			   yy != undefined ){

				var cce = $('.canvas-pool canvas[data-layer='+l+'][data-frame='+f+']');
				if(cce.length){
					drawCanvasLine(cce, x, y, xx, yy, cc, ss);
				}
			} else if(me && dd) {
				//console.log(y, yy);
				//drawCanvasLine(null, x, y, xx, yy, cc, ss)
			}
		} else {
			//anon draw op
			var cce = $('.canvas-pool canvas[data-layer='+l+'][data-frame='+f+']');
			if(cce.length){
				drawCanvasLine(cce, x, y, xx, yy, cc, ss);
			}
		}

	});
	RoomListSocket.on('chat', function(d){
		addChatMessage(null, d.msg, d.name, d.time, true)
	})
}








