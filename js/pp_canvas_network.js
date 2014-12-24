// this is for network code



var roomSocketConnection = function(r){
	if(!r) return false
	
	
	var ur = url + '/' + r
	
	this.id = null
	this.ad = null
	this.pp = false
	
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
	this.private = function(q){
		if(typeof q != "undefined"){
			this.pp = q
		}
		return (this.pp)
	}
	this.admin = function(q){
		if(typeof q != "undefined"){
			this.ad = q
		}
		return (this.ad)
	}
	this.isAdmin = function(){
		return (this.ad == this.id)
	}
	
	
	this.qq = {room: r}
	this.query = function(q){
		if(typeof q == "object"){
			this.socket.io.opts.query = $.param($.extend(this.qq, q))
		}
		return this.qq
	}
	
	
	
	
	
	
	var pthis = this
	this.socket = io.connect(url, {
		query: $.param(this.qq),
		forceNew: true,
		autoConnect: false,
		reconnectionAttempts:5
	})
	

	
	this.socket.on('connect', function(c){
		pthis.sid(pthis.socket.io.engine.id)
		$('.canvas-cursor').not('.cursor-self').remove() //clear out just in case
		console.log('Connected as', pthis.id)
		
	}).on('connect_error', function(d){
		addMessage('Connection error -- ' + d.message)
		updateInfo()
	}).on('reconnect_failed', function(d){
		addMessage('Reconnection failed.')
		updateInfo()
	}).on('reconnect_error', function(d){
		addMessage('Reconnection error -- ' + d.message)
		updateInfo()
	}).on('disconnect', function(c){
		console.log('disconnect', c)
		if(c == pthis.sid() || c == 'forced close'){
			// i disconnected - remove everyone >:D
			pthis.id = null
			$('.canvas-cursor').not('.cursor-self').remove()
			$('body').removeClass('connected is-admin')
			
		} else {
			$('.canvas-cursor#' + c).remove()
		}
		updateInfo()
		
		
	}).on('rs', function(d){
		if(d.admin != undefined) pthis.admin(d.admin)
		if(d.private != undefined) pthis.private(d.private)
		
		
		updateInfo()
		
	}).on('peer', function(d){
		if(d.id != pthis.id){
			console.log('Peer connected: ' + d.id)
			var e = $('<div/>', {class: 'canvas-cursor', id:d.id, 'data-name': d.name}).css({left: d.x, top: d.y}).data('x', d.x).data('y', d.y)
			if(d.s != undefined) Brush.size(d.s, e)
			$('#mouse-pool').append(e)
		}
		
	}).on('canvas', function(d){
		console.log(d.layers)
		if(d.layers != undefined){ // create new
			initCanvas(d.width, d.height, d.layers.length, d.layers)
		} else {
			initCanvas(d.width, d.height)
		}
		
		
		pthis.reload(function(){
			updateFrameinfoSlow()
			updateInfo()
		})
		
	}).on('d', function(d){
		if(d.id != pthis.id){
			var e = $('.canvas-cursor#' + d.id)
			if(e.length){
				console.log('found painter ' + d.id);
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
					if(d.d) { x = d.x, y = d.y } // v0v
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








