// this is for network code



var connectRoom = function(r, q){
	if(!r) return false
	
	
	var ur = url + '/' + r
	
	var id = null
	this.reload = function(callback){
		var cs = $('.canvas-pool canvas'),
			ii = cs.length
		
		if(ii){
			cs.each(function(k, e){
				var c = $(e),
					s = ur + '/image/' + c.data('layer') + '/' + c.data('frame') + '?t=' + new Date().getTime()
				
				loadSqnyaImage(s, function(i){
					var img = new Image;
					
					img.onload = function() {
						c.get(0).getContext('2d').drawImage(img, 0, 0)
						if((--ii) == 0){
							callback()
						}
					}
					img.src = i;
					
					
				})
			})
		}
	}
	this.sid = function(i){
		if(i != undefined) this.id = i
		return this.id
	}
	this.connected = function(){
		return this.socket.connected
	}
	
	
	
	
	
	
	var pthis = this
	console.log('Connecting to socket', ur)
	this.socket = io.connect(url, {query: 'room=' + r + '&' + q});

	
	this.socket.on('connect', function(c){
		pthis.sid(pthis.socket.io.engine.id)
		console.log('Connected as', pthis.id)
		
	}).on('disconnect', function(c){
		
		if(c == pthis.sid()){
			// i disconnected - remove everyone >:D
			pthis.id = null
			$('.canvas-cursor').not('.cursor-self').remove()
		} else {
			$('.canvas-cursor#' + c).remove()
		}
		
		
	}).on('admin', function(d){
		console.log(d)
		
	}).on('peer', function(d){
		var e = $('<div/>', {class: 'canvas-cursor', id:d.id, 'data-name': d.name}).css({left: d.x, top: d.y}).data('x', d.x).data('y', d.y)
		if(d.s != undefined) Brush.size(d.s, e)
		$('#mouse-pool').append(e)
		
	}).on('canvas', function(d){
		console.log(d.layers)
		initCanvas(d.width, d.height, d.layers.length, d.layers)
		
		pthis.reload(function(){
			updateFrameinfoSlow()
			updateCallbacks()
			updateInfo()
		})
		
	}).on('d', function(d){
		if(d.id != pthis.id){
			var e = $('.canvas-cursor#' + d.id)
			if(e.length){
				
				var ow = $('canvas.focused').get(0).width,
					oh = $('canvas.focused').get(0).height,
					nw = $('.canvas-workarea').width(),
					nh = $('.canvas-workarea').height(),
					
					x = e.data('x'),
					y = e.data('y'),
					l = e.data('layer'),
					f = e.data('frame')
					
					
				
				if(d.x != undefined) e.css('left', (d.x/oh)*nh).data('x', d.x)
				if(d.y != undefined) e.css('top', (d.y/ow)*nw).data('y', d.y)
				if(d.l != undefined) {e.data('layer', d.l), l = d.l}
				if(d.f != undefined) {e.data('frame', d.f), f = d.f}
				
				if(d.d != undefined && d.d != e.hasClass('drawing')){
					//if(d.d) { x = d.x, y = d.y } // v0v
					e.toggleClass('drawing', d.d)
				}
				
				
				if(d.s != undefined) Brush.size(d.s, e)
				if(d.c != undefined) Brush.color(d.c, e)
				
				
				if(d.d && 
				   l != undefined && 
				   f != undefined && 
				   d.x != undefined && 
				   d.y != undefined){
					
					var cc = $('.canvas-pool canvas[data-layer='+l+'][data-frame='+f+']')
					if(cc.length){
						drawCanvasLine(cc, x, y, d.x, d.y, d.c, d.s)
					}
					
				}
			}
		}
	}).on('chat', function(d){
		addChatMessage(r, d.msg, d.name, d.time, true)
	})
}








