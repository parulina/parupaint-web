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
		socket.emit('join', {
			name: parupaintConfig.name,
			version: 'ppweb'
		});
	});
	this.socket.on('canvas', function(e){
		if(typeof e.width != "number") return;
		if(typeof e.height != "number") return;
		if(typeof e.layers != "object") return;
		parupaintCanvas.cleanup();
		for(var ll = 0; ll < e.layers.length; ll++){
			var l = e.layers[ll];
			for(var ff = 0; ff < l.length; ff++){
				var f = l[ff];

				var c = document.createElement("canvas");
				if(ff == 0) c.className = "visible";
				c.width = e.width;
				c.height = e.height;
				c.setAttribute("data-layer", ll);
				c.setAttribute("data-frame", ff);

				document.querySelector(".canvas-pool").appendChild(c);
			}
		}
		parupaintCanvas.init();
		socket.emit('img');
	});
	this.socket.on('fill', function(e){
		if(typeof e.l != "number") return;
		if(typeof e.f != "number") return;
		if(typeof e.c != "string") return;
		console.log("Clear to", e.c);
		parupaintCanvas.clear(parupaintCanvas.get(e.l, e.f), e.c);

	});
	this.socket.on('chat', function(d) {
		(new parupaintChat()).add(d.message, d.name);
		if(d.name && d.name != parupaint.name) navigator.vibrate([100, 50, 100]);
	});
	this.socket.on('paste', function(e){
		socket.emit('img');
	});
	this.socket.on('img', function(e){
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
	this.socket.on('draw', function(e){
		if(typeof e.id == "number"){
			if(e.id == parupaint.me) return;

			var c = new parupaintCursor(e.id);
			var ox = c.x(), oy = c.y(), dd = false, td = false;

			if(typeof e.x == "number") { c.x(e.x); dd = true; }
			if(typeof e.y == "number") { c.y(e.y); dd = true; }
			if(typeof e.w == "number") c.size(e.w);
			if(typeof e.p == "number") c.pressure(e.p);
			if(typeof e.c == "string") c.color(e.c);
			if(typeof e.t == "number") c.tool(e.t);
			if(typeof e.l == "number") c.layer(e.l);
			if(typeof e.f == "number") c.frame(e.f);

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
					socket.emit("img", {l: l, f: f});
				}, 300);
			}
			if(c.drawing() && dd){
				parupaintCanvas.line(parupaintCanvas.get(l, f),
					ox, oy, c.x(), c.y(), c.color(), c.size() * p);
			}
		}
	});
	this.socket.on('peer', function(e){
		if(typeof e.id != "number") return;

		if(typeof e.disconnect == "boolean" && e.disconnect){
			var c = new parupaintCursor(e.id).cursor;
			if(c) c.parentNode.removeChild(c);
		} else {
			// Someone connecting
			var c = new parupaintCursor(e.id);
			if(e.id < 0){
				// This is me
				c = new parupaintCursor();
				parupaint.me = -e.id;
				socket.emit('canvas');
			}
			if(!c.cursor){
				var f = document.createElement("div");
				f.className = "canvas-cursor";
				f.id = 'c' + e.id;
				document.querySelector(".canvas-workarea").appendChild(f);
				c = new parupaintCursor(e.id);
			}
			if(c.cursor && e.id > 0){
				c.x(e.x).y(e.y).size(e.w);
			}
			//TODO reload canvas
		}
		if(typeof e.name == "string" && e.name.length){
			var c = new parupaintCursor(e.id);
			if(c.cursor) c.name(e.name);
		}
	});
};
