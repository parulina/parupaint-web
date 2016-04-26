// this file contains most network related functions

// QT uses #AARRGGBB but html stuff uses #RRGGBBAA.
var correctHex = function(hex){
	var hexcode = hex.replace('#','');

	if(hexcode.length == 8)
		hexcode = hexcode.slice(2) + hexcode.substr(0, 2);
	if(hexcode.length == 3)
		hexcode = hexcode.slice(1) + hexcode.substr(0, 1);

	return '#' + hexcode;
};

var parupaintNetwork = function(host){
	console.log("Connecting to", host);

	this.socket = new parupaintSocket(host);
	this.socket.Connect();

	this.reload_timeout = null;
	this.joined = false;
	var pthis = this;

	var unpack_img = function(base64data){
		if(!base64data) return null;
		var binary = new Uint8Array(window.atob(base64data).split('').map(function(x){
			return x.charCodeAt(0);
		}));
		return pako.inflate(binary);
	};

	this.readOnly = function(){
		return !(this.socket.connected && this.joined);
	};

	var socket = this.socket;
	this.socket.on('join', function(e){
		console.info("Joined.");
		pthis.joined = true;
	});
	this.socket.on('open', function(e){
		socket.emit('name', {
			name: parupaintConfig.name
		});
		socket.emit('join', {version: parupaintConfig.versionCompatible});
	});
	this.socket.on('canvas', function(e){
		if(typeof e.canvasWidth != "number") return;
		if(typeof e.canvasHeight != "number") return;
		if(typeof e.layers != "object") return;

		var w = e.canvasWidth, h = e.canvasHeight;

		if(typeof e.resize == "boolean" && e.resize){
			var canvases = document.querySelectorAll('.canvas-pool > canvas');
			for(var i = 0; i < canvases.length; i++){
				var canvas = canvases[i];
				canvas.width = w;
				canvas.height = h;
			}
		} else {
			parupaintCanvas.cleanup();
			for(var l in e.layers){
				var layer = e.layers[l];
				for(var f in layer.frames){
					var frame = layer.frames[f];

					var c = document.createElement("canvas");
					if(f == 0) c.className = "visible";
					c.width = w;
					c.height = h;
					c.setAttribute("data-layer", parseInt(l));
					c.setAttribute("data-frame", parseInt(f));

					document.querySelector(".canvas-pool").appendChild(c);
				}
			}
		}
		parupaintCanvas.init();
		if(typeof e.backgroundColor == "string"){
			parupaintCanvas.backgroundColor(correctHex(e.backgroundColor));
		}
		socket.emit('image');
	});
	this.socket.on('fill', function(e){
		if(typeof e.l != "number") return;
		if(typeof e.f != "number") return;
		if(typeof e.c != "string") return;
		var color = correctHex(e.c);
		console.log("Clear to", color);
		parupaintCanvas.clear(parupaintCanvas.get(e.l, e.f), color);

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
	this.socket.on('info', function(e){
		if(typeof e["project-bgc"] == "string"){
			parupaintCanvas.backgroundColor(correctHex(e["project-bgc"]));
		}
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
			if(typeof e.c == "string") c.color(correctHex(e.c));
			if(typeof e.t == "number") c.tool(e.t);
			if(typeof e.a == "number") c.pattern(e.a);
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

			// if lifted cursor and it's a different tool
			if(td && (c.tool() != 0 || c.pattern() != 0)){
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
