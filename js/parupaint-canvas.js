function hexnormalize(hex){
	if(!hex) return hex;

	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	if(hex.length <= 4){
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});
	}
	if(hex[0] != '#') hex = '#' + hex;
	return hex;
}
function hex2rgba(hex) {
	if(!hex || !hex.length) return {r: 0, g: 0, b: 0, a: 0};

	hex = hexnormalize(hex);
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);

	if(!result) {
		return {r: 255, g: 255, b: 255, a: 255};
	}

	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16),
		a: result[4] == undefined ? 255 : parseInt(result[4], 16)
	} : null;
};

var parupaintBrush = function(s, c){
	// brush has explicit members that just contains the most important info
	this.size = (typeof s == "number" ? s : 1.0);
	this.color = (typeof c == "string" ? c : "#000");
};
var parupaintBrushGlass = function(){
	this.current = 0;
	this.brushes = [
		new parupaintBrush(1, "#000"),
		new parupaintBrush(16, "#00000000")
	];
	this.brush = function(b) {
		if(b != null) {
			this.current = b;
			if(typeof this.onchange == "function") this.onchange(this.brush());
			return this;
		}
		return this.brushes[this.current];
	}
	this.opposite = function() {
		return(this.current == 0 ? 1 : 0)
	}
	this.size = function(size) {
		if(typeof size == "undefined") return this.brush().size;

		this.brushes[this.current].size = size < 1 ? 1 : size;
		if(typeof this.onchange == "function") this.onchange(this.brush());
		return this;
	}
	this.color = function(color) {
		if(typeof color == "undefined") return this.brush().color;

		this.brushes[this.current].color = color;
		if(typeof this.onchange == "function") this.onchange(this.brush());
		return this;
	}
};

var parupaintCursor = function(id){
	this.cursor = document.querySelector(".canvas-cursor.cursor-self");
	if(typeof id == "string") {
		// do stuff
		this.cursor = document.getElementById(id);
	}
	if(typeof id == "number"){
		if(id > 0) this.cursor = document.getElementById('c' + id);
	}
	if(!this.cursor) return null;

	this.update = function(b){
		if(typeof b.color == "function") this.color(b.color());
		if(typeof b.size == "function")  this.size(b.size());
		return this;
	};
	this.x = function(x){
		if(typeof x == "undefined") return parseInt(this.cursor.getAttribute("data-x"));
		this.cursor.setAttribute("data-x", x);
		this.cursor.style.left = x + (typeof x == "number" ? "px" : "");
		return this;
	};
	this.y = function(y){
		if(typeof y == "undefined") return parseInt(this.cursor.getAttribute("data-y"));
		this.cursor.setAttribute("data-y", y);
		this.cursor.style.top = y + (typeof y == "number" ? "px" : "");
		return this;
	};
	this.pressure = function(p){
		if(typeof p == "undefined") {
			p = this.cursor.getAttribute("data-pressure");
			return parseFloat((!p || !p.length) ? "1.0" : p);
		}
		this.cursor.setAttribute("data-pressure", p);
		var cs = this.cursor.querySelector(".cursor-size");
		if(cs){
			cs.style.width = p + "px";
			cs.style.height = p + "px";
		}
		return this;
	};
	this.size = function(s){
		if(typeof s == "undefined") {
			s = this.cursor.getAttribute("data-size");
			return parseFloat((!s || !s.length) ? "1" : s);
		}
		this.cursor.setAttribute("data-size", s);
		this.cursor.style.width = s + "px";
		this.cursor.style.height = s + "px";
		return this;
	};
	this.color = function(c){
		if(typeof c == "undefined") {
			c = this.cursor.getAttribute("data-color");
			return ((!c || !c.length) ? "#000000" : c);
		}
		this.cursor.setAttribute("data-color", c);
		this.cursor.style.color = c;
		return this;
	};
	this.layer = function(l){
		if(typeof l == "undefined"){
			l = this.cursor.getAttribute("data-layer");
			return parseInt((!l || !l.length) ? "0" : l);
		}
		this.cursor.setAttribute("data-layer", l);
		return this;
	};
	this.frame = function(f){
		if(typeof f == "undefined"){
			f = this.cursor.getAttribute("data-frame");
			return parseInt((!f || !f.length) ? "0" : f);
		}
		this.cursor.setAttribute("data-frame", f);
		return this;
	};
	this.pattern = function(p){
		if(typeof p == "undefined"){
			p = this.cursor.getAttribute("data-pattern");
			return parseFloat((!p || !p.length) ? "0" : p);
		}
		this.cursor.setAttribute("data-pattern", p);
		return this;
	};
	this.tool = function(t){
		if(typeof t == "undefined"){
			t = this.cursor.getAttribute("data-tool");
			return parseFloat((!t || !t.length) ? "0" : t);
		}
		this.cursor.setAttribute("data-tool", t);
		return this;
	};
	this.drawing = function(d){
		if(typeof d == "undefined"){
			d = this.cursor.getAttribute("data-drawing");
			return ((!d || !d.length) ? false : (d != "false"));
		}
		this.cursor.setAttribute("data-drawing", d);
		return this;
	};
	this.name = function(n){
		if(typeof n == "undefined") return this.cursor.getAttribute("data-name");
		this.cursor.setAttribute("data-name", n);
		return this;
	};

};

var parupaintCanvas = new function(){
	this.changed = false;
	this.cleanup = function(){
		var pool = document.querySelector(".canvas-pool");
		pool.innerHTML = '';
		pool.style = "";
	};
	this.init = function(){
		var workarea = document.querySelector(".canvas-workarea");
		var canvases = document.querySelectorAll(".canvas-pool > canvas");
		var w, h;
		for(var i = 0; i < canvases.length; i++){
			var canvas = canvases[i];
			w = canvas.width; h = canvas.height;

			canvas.takeAttribute = function(a){
				if(!this.hasAttribute(a)) return null;

				var aa = this.getAttribute(a);
				this.removeAttribute(a);
				return aa;
			};
			canvas.oncontextmenu = function(e){
				e.preventDefault();
				return false;
			};
		}
		workarea.style.width = w + "px";
		workarea.style.height = h + "px";
		workarea.setAttribute("data-ow", w);
		workarea.setAttribute("data-oh", h);
	};
	this.backgroundColor = function(c){
		var pool = document.querySelector(".canvas-pool");
		if(typeof c == "undefined") return pool.style.backgroundColor;

		var col = hex2rgba(c);
		pool.style.backgroundColor = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (col.a / 255.0) + ')';

		return this;
	}
	this.get = function(l, f) {
		return document.querySelector('.canvas-pool > canvas[data-layer="'+l+'"][data-frame="'+f+'"]');
	}
	this.dataurl = function(){
		var workarea = document.querySelector(".canvas-workarea");
		var ow = parseInt(workarea.getAttribute("data-ow"));
		var oh = parseInt(workarea.getAttribute("data-oh"));

		var canvas = document.createElement("canvas");
		canvas.width = ow;
		canvas.height = oh;
		var canvases = document.querySelectorAll(".canvas-pool > canvas");
		for(var i = 0; i < canvases.length; i++){
			canvas.getContext("2d").drawImage(canvases[i], 0, 0);
		}
		return canvas.toDataURL();
	};
	this.clear = function(canvas, color){
		if(!canvas) return;

		var w = canvas.width,
		    h = canvas.height;
		var ctx = canvas.getContext('2d');

		// should probably make this better.
		if(hex2rgba(color).a == 0) {
			ctx.clearRect(0, 0, w, h);
		} else {
			if(color.length >= 7) color = color.substr(0, 7);
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, w, h);
		}
	};
	this.line = function(canvas, x1, y1, x2, y2, color, width){
		if(!canvas) return;

		var ctx = canvas.getContext('2d');
		var composite = ctx.globalCompositeOperation;
		var col = hex2rgba(color);

		if(!col.a) {
			ctx.globalCompositeOperation = "destination-out";
			col.a = 255;
		}
		ctx.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (col.a / 255.0) + ')';

		ctx.lineWidth = width;
		ctx.lineCap = 'round';

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

		ctx.globalCompositeOperation = composite;

		this.changed = true;
	};
};

var parupaintChat = function() {
	this.add = function(msg, user){
		var e = document.createElement("div");
		e.className = "chat-message";
		if(typeof user == "string" && user.length){
			var u = document.createElement("div"),
			    m = document.createElement("div");
			u.className = "chat-user";
			m.className = "chat-text";
			u.appendChild(document.createTextNode(user));
			m.appendChild(document.createTextNode(msg));

			e.appendChild(u);
			e.appendChild(m);
		} else {
			e.innerHTML = msg;
		}
		var s = document.querySelector(".chat-messages");
		var autofollow = (s.scrollTop == (s.scrollHeight - s.clientHeight));
		s.appendChild(e);

		if(autofollow) s.scrollTop = s.scrollHeight;
	}
};

window.addEventListener("load", function(e){
	var canvas = document.querySelector(".parupaint-canvas");
	var scrollarea = canvas.querySelector(".canvas-scrollarea");
	if(!canvas || !scrollarea) return;

	var change_name = function(name){
		if(name && name.length){
			localStorage.name = name;
			window.location.reload();
		}
	};
	var download_canvas = function(){
		var url = parupaintCanvas.dataurl();
		if(url){
			var f = 'Drawing_at_' + new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/\:/g, '.');
			var a = document.createElement("a");
			a.className = "download-link";
			a.href = url;
			a.target = "_blank";
			a.className = "chat-message";
			a.innerHTML = f;
			a.download = f + ".png";
			document.querySelector(".chat-messages").appendChild(a);

			a.click();
		}
	};

	var inputcolor = function(col){
		var c = document.querySelector('.oekaki-buttons > input[name="color"]');
		if(c){
			if(!col) return c.value;
			c.value = hexnormalize(col).substr(0, 7);
		}
	};

	parupaint.brushglass = new parupaintBrushGlass();
	var brushglass = parupaint.brushglass;
	brushglass.onchange = function(brush){
		inputcolor(brush.color);

	};

	var netcache = {
		x: 0,
		y: 0,
		s: 0,
		d: false,
		c: '',
		update: function(net){
			var n = {};
			if(net.x != this.x) n.x = this.x = net.x;
			if(net.y != this.y) n.y = this.y = net.y;
			if(net.s != this.s) n.s = this.s = net.s;
			if(net.c != this.c) n.c = this.c = net.c;
			if(net.p != this.p) n.p = this.p = net.p;
			if(net.d != this.d) n.d = this.d = net.d;
			return n;
		}
	};

	if(typeof window.localStorage == "object"){
		if(typeof localStorage["canvasdimensions"] == "string"){
			var a = localStorage["canvasdimensions"].split(",");
			canvas.style.width = parseInt(a[0]) + "px";
			canvas.style.height = parseInt(a[1]) + "px";
		}
		if(typeof localStorage.name == "string"){
			parupaintConfig.name = localStorage.name;
		}
	}
	var space = false;
	canvas.addEventListener("keyup", function(e) {
		if(e.keyCode == 32){
			space = false;
		}
	});
	canvas.addEventListener("keydown", function(e) {
		if(e.target.tagName == "INPUT") return;

		console.log("key:", e.keyCode);
		if(e.keyCode == 32){
			space = true;
			e.preventDefault();
			return false;
		}
		if(e.keyCode >= 49 && e.keyCode <= 54){
			var a = (e.keyCode - 49);
			var ar = [
				1,
				3,
				10,
				20,
				50,
				64
			];
			(new parupaintCursor).update(brushglass.size(ar[a]));
		}
		if(e.keyCode == 113) {
			change_name(prompt("enter new name"));
		}
		// 114 is F3, used for search
		if(e.keyCode == 115) {
			download_canvas();
		}
		if(e.keyCode == 82) {
			if(e.ctrlKey){
				if(parupaint.net && parupaint.net.socket.connected){
					console.log("Reloading image");
					parupaint.net.socket.emit('image');
				}
				return e.preventDefault();
			} else {
				var x = (new parupaintCursor()).x(),
				    y = (new parupaintCursor()).y();

				var a = parupaintCanvas.get(0, 0).getContext('2d').getImageData(x, y, 1, 1).data;
				var d = [a[0], a[1], a[2], a[3]].map(function(e){
					var na = ("00" + e.toString(16)).slice(-2);
					return na;
				});
				var hex = '#' + d.join('');
				console.log("Pick color", hex);
				(new parupaintCursor()).update(brushglass.color(hex));
			}
		}
		if(e.keyCode == 69) {
			(new parupaintCursor()).update(brushglass.brush(brushglass.opposite()));
		}
	});
	parupaint.pointer = new parupaintPointerEvents(canvas);
	canvas.addEventListener('mousedown', function(e){
		if(e.button == 1 && e.which == 2){
			scrollarea.style.overflow = "hidden";
			return false;
		}
	});
	canvas.addEventListener('mouseup', function(e){
		if(e.button == 1 && e.which == 2){
			scrollarea.style.overflow = "";
			return false;
		}
	});
	canvas.addEventListener('mousemove', function(e){
		if(space){
			e.stopPropagation();
			scrollarea.scrollLeft = scrollarea.scrollLeft - e.movementX;
			scrollarea.scrollTop = scrollarea.scrollTop - e.movementY;
		}
	}, true);
	parupaint.pointer.onMove = function(d){

		if(d.b[2]){
			scrollarea.scrollLeft = scrollarea.scrollLeft - d.mx;
			scrollarea.scrollTop = scrollarea.scrollTop - d.my;
			var cur = (new parupaintCursor());
			cur.x(cur.x() - d.mx).y(cur.y() - d.my);
			return;
		}

		if(parupaint.net && parupaint.net.readOnly()) return;

		var net = {
			x: d.x, y: d.y,
			s: brushglass.size(),
			c: brushglass.color(),
			p: d.p, d: (d.b[1])
		};

		if(net.d){
			var s = net.s * net.p;
			if(s < 1) s = 1;
			parupaintCanvas.line(d.canvas, d.ox, d.oy, d.x, d.y, net.c, s);
		}
		if(parupaint.net && parupaint.net.socket.connected){
			parupaint.net.socket.emit('brush', netcache.update(net));
		}
	};

	canvas.addEventListener("wheel", function(e){
		var y = e.deltaY * (e.deltaMode == 0 ? 0.1 : 2)
		if(e.target.tagName == "CANVAS") {
			if(this.classList.contains("scroll-actions")){
				var w = (new parupaintCursor()).update(brushglass.size(brushglass.size() - y)).size();
				// Update cache and push out new width
				if(parupaint.net && parupaint.net.socket.connected){
					parupaint.net.socket.emit('brush', netcache.update({s: w}));
				}
				e.preventDefault();
				return false;
			}
		}
	});
	var buttons = document.querySelector(".oekaki-buttons");
	if(buttons){
		buttons.clickButton = function(inputname, func){
			var c = this.querySelector('.oekaki-buttons > input[name="' + inputname + '"]');
			if(c) c.onclick = func;
		};
		var color = document.querySelector('.oekaki-buttons > input[name="color"]');
		if(color){
			color.oninput = function(){
				(new parupaintCursor()).update(brushglass.color(this.value));
			};
		}
		buttons.clickButton("brush", function(){
			(new parupaintCursor()).update(brushglass.brush(brushglass.opposite()));
		});
		buttons.clickButton("bd", function(){
			(new parupaintCursor()).update(brushglass.size(brushglass.size() - 2));
		});
		buttons.clickButton("bi", function(){
			(new parupaintCursor()).update(brushglass.size(brushglass.size() + 2));
		});
		buttons.clickButton("n", function(){
			change_name(prompt("enter new name"));
		});
		buttons.clickButton("d", function(){
			download_canvas();
		});
	}
	var chatinput = document.querySelector("input.chat-input");
	if(chatinput) {
		chatinput.onkeydown = function(e){
			if(e.keyCode == 13){
				var msg = e.target.value;
				if(msg && msg.length){
					e.target.value = "";
					if(parupaint.net && parupaint.net.socket.connected){
						parupaint.net.socket.emit('chat', {
							message: msg,
							name: parupaintConfig.name
						});
					};
				}
			}
		};
	}

	parupaintCanvas.init();
	//parupaintConfig.connect_on_load = false;
	if(parupaintConfig.connect_on_load === true){
		if(parupaintConfig.ws_host.match(/:\d\d\d\d\/?$/) === null){
			parupaintConfig.ws_host = parupaintConfig.ws_host + ":1108";
		}
		parupaint.net = new parupaintNetwork(parupaintConfig.ws_host);
	}
});
