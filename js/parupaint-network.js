// this file contains most network related functions

var parupaintNetwork = function(host){
	console.log("Connecting to", host);

	this.socket = new parupaintSocket(host);
	this.socket.Connect();

	this.reload_timeout = null;
	var pthis = this;

	var unpack_img = function(base64data){
		if(!base64data) return null;
		var binary = new Uint8Array(window.atob(base64data).split('').map(function(x){
			return x.charCodeAt(0);
		}));
		return pako.inflate(binary);
	};

	var socket = this.socket;
	this.socket.on('open', function(e){
		socket.emit('name', {
			name: parupaintConfig.name
		});
	});
	this.socket.on('canvas', function(e){
		if(typeof e.w != "number") return;
		if(typeof e.h != "number") return;
		if(typeof e.layers != "object") return;
		parupaintCanvas.cleanup();
		for(var ll = 0; ll < e.layers.length; ll++){
			var l = e.layers[ll];
			for(var ff = 0; ff < l.length; ff++){
				var f = l[ff];

				var c = document.createElement("canvas");
				if(ff == 0) c.className = "visible";
				c.width = e.w;
				c.height = e.h;
				c.setAttribute("data-layer", ll);
				c.setAttribute("data-frame", ff);

				document.querySelector(".canvas-pool").appendChild(c);
			}
		}
		parupaintCanvas.init();
		socket.emit('image');
	});
	this.socket.on('fill', function(e){
		if(typeof e.l != "number") return;
		if(typeof e.f != "number") return;
		if(typeof e.c != "string") return;
		console.log("Clear to", e.c);
		parupaintCanvas.clear(parupaintCanvas.get(e.l, e.f), e.c);

	});
	this.socket.on('chat', function(d) {
		if(typeof d.message == "string" && d.message.length) {
			(new parupaintChat()).add(d.message, d.name);
			if(d.name && d.name != parupaint.name) {
				if(typeof navigator.vibrate == "function")
					navigator.vibrate([100, 50, 100]);
			}
		}
	});
	this.socket.on('lfc', function(e){
		socket.emit('canvas');
	});
	this.socket.on('lfa', function(e){
		socket.emit('canvas');
	});
	this.socket.on('paste', function(e){
		socket.emit('image');
	});
	this.socket.on('image', function(e){
		if(typeof e.w != "number") return;
		if(typeof e.h != "number") return;
		if(typeof e.l != "number") return;
		if(typeof e.f != "number") return;
		if(typeof e.data != "string") return;

		var data = unpack_img(e.data);
		var canvas = parupaintCanvas.get(e.l, e.f);
		if(data && canvas){
			var ctx = canvas.getContext("2d");
			var img = ctx.createImageData(e.w, e.h);
			for(var i = 0, l = img.data.length; i < l; i += 4){
				img.data[i  ] = data[i+2];
				img.data[i+1] = data[i+1];
				img.data[i+2] = data[i];
				img.data[i+3] = data[i+3];
			}
			ctx.putImageData(img, 0, 0);
		}
	});
	this.socket.on('brush', function(e){
		if(typeof e.id == "number"){

			var c = new parupaintCursor(e.id);
			if(typeof e.exists == "boolean"){
				if(e.exists && !c.cursor){
					var f = document.createElement("div");
					f.className = "canvas-cursor";
					f.id = 'c' + e.id;
					document.querySelector(".canvas-workarea").appendChild(f);
					c = new parupaintCursor(e.id);

				} else if(!e.exists && c.cursor) {
					c.cursor.parentNode.removeChild(c.cursor);
					c.cursor = null;
				}
			}
			if(!c.cursor) return;

			var ox = c.x(), oy = c.y(), dd = false, td = false;

			if(typeof e.x == "number") { c.x(e.x); dd = true; }
			if(typeof e.y == "number") { c.y(e.y); dd = true; }
			if(typeof e.s == "number") c.size(e.s);
			if(typeof e.p == "number") c.pressure(e.p);
			if(typeof e.c == "string") c.color(e.c);
			if(typeof e.t == "number") c.tool(e.t);
			if(typeof e.l == "number") c.layer(e.l);
			if(typeof e.f == "number") c.frame(e.f);
			if(typeof e.n == "string") c.name(e.n);

			if(typeof e.d == "boolean"){
				if(e.d && !c.drawing()){
					ox = c.x(); oy = c.y();

				} else if(!e.d && c.drawing()){
					td = true;
				}
				c.drawing(e.d);
			}

			var p = c.pressure(),
			    l = c.layer(),
			    f = c.frame();

			if(td && c.tool() != 0){
				if(pthis.reload_timeout) clearTimeout(pthis.reload_timeout);
				pthis.reload_timeout = setTimeout(function(){
					socket.emit("image", {l: l, f: f});
				}, 300);
			}
			if(c.drawing() && dd){
				parupaintCanvas.line(parupaintCanvas.get(l, f),
					ox, oy, c.x(), c.y(), c.color(), c.size() * p);
			}
		}
	});
};
