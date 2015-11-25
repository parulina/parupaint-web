function hex2rgba(hex) {
	if(!hex || !hex.length) return {r: 0, g: 0, b: 0, a: 0};
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});
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
		return this;
	}
	this.color = function(color) {
		if(typeof color == "undefined") return this.brush().color;

		this.brushes[this.current].color = color;
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

			var pre;
			if((pre = canvas.takeAttribute("data-prefill"))){
				this.clear(canvas, pre);
			}
			// TODO add more?

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
		ctx.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (col.a / 255.0) + ')'

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

window.addEventListener("load", function(e){
	var canvas = document.querySelector(".parupaint-canvas");
	var scrollarea = canvas.querySelector(".canvas-scrollarea");
	if(!canvas || !scrollarea) return;

	var brushglass = new parupaintBrushGlass();
	var netcache = {
		x: 0,
		y: 0,
		w: 0,
		d: false,
		c: '',
		update: function(net){
			var n = {};
			if(net.x != this.x) n.x = this.x = net.x;
			if(net.y != this.y) n.y = this.y = net.y;
			if(net.w != this.w) n.w = this.w = net.w;
			if(net.c != this.c) n.c = this.c = net.c;
			if(net.d != this.d) n.d = this.d = net.d;
			return n;
		}
	};

	if(typeof localStorage["canvasdimensions"] == "string"){
		var a = localStorage["canvasdimensions"].split(",");
		canvas.style.width = parseInt(a[0]) + "px";
		canvas.style.height = parseInt(a[1]) + "px";
	}
	canvas.addEventListener("keydown", function(e) {
		console.log("key:", e.keyCode);
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
			var name = prompt("enter new name");
			if(name && name.length){
				localStorage.name = name;
				window.location.reload();
			}
		}
		if(e.keyCode == 82) {
			var x = (new parupaintCursor()).x(),
			    y = (new parupaintCursor()).y();

			var d = Array.from(parupaintCanvas.get(0, 0).getContext('2d').getImageData(x, y, 1, 1).data).map(function(e){
				var na = ("00" + e.toString(16)).slice(-2);
				return na;
			});
			var hex = '#' + d.join('');
			console.log("Pick color", hex);
			(new parupaintCursor()).update(brushglass.color(hex));
		}
		if(e.keyCode == 69) {
			(new parupaintCursor()).update(brushglass.brush(brushglass.opposite()));
		}
	});
	canvas.addEventListener("mouseenter", function(e) {
		canvas.focus();
	});
	canvas.addEventListener("mouseleave", function(e) {
		canvas.blur();
	});
	var drawbtn_down = false;
	canvas.addEventListener("mouseup", function(e) {
		//TODO testme
		if(e.target == this && e.target.style.resize.length) {
			localStorage["canvasdimensions"] =
				parseInt(this.style.width) + "," + parseInt(this.style.height);
		}
		drawbtn_down = false;
	});
	canvas.addEventListener("mousedown", function(e){
		if((e.buttons || e.which) == 1) {
			drawbtn_down = true;
		}
		if((e.buttons || e.which) == 4) e.preventDefault();
		if((e.buttons || e.which) == 2){
			if(e.target.tagName == "CANVAS") {
				e.preventDefault();
				new parupaintCursor().update(brushglass.brush(brushglass.opposite()));
				return false;
			}
		}
	});
	canvas.addEventListener("mousemove", function(e){
		if(e.target.tagName == "CANVAS") {
			var bcr = e.target.parentNode.getBoundingClientRect();
			var ax = e.clientX - (bcr.x || bcr.left);
			    ay = e.clientY - (bcr.y || bcr.top);
			if(typeof e.movementX == "undefined" && typeof e.movementY == "undefined"){
				var old_x = (new parupaintCursor()).x(),
				    old_y = (new parupaintCursor()).y();
				e.movementX = ax - old_x;
				e.movementY = ay - old_y;
			}
			var w = (new parupaintCursor()).x(ax).y(ay).size(),
			    c = (new parupaintCursor()).color();

			var net = {x: ax, y: ay, w: w, c: c, d: false};
			if(drawbtn_down == 1){
				net.d = true;
				parupaintCanvas.line(e.target,
					ax, ay, ax - e.movementX, ay - e.movementY,
					brushglass.color(), brushglass.size());
			}
			if(parupaint.net && parupaint.net.socket.connected){
				var a = netcache.update(net);
				a.p = 1.0;
				parupaint.net.socket.emit('draw', a);
			}
		}
		if(e.buttons == 4) {
			scrollarea.scrollLeft = scrollarea.scrollLeft - e.movementX;
			scrollarea.scrollTop = scrollarea.scrollTop - e.movementY;
		}
	});
	canvas.addEventListener("wheel", function(e){
		var y = e.deltaY * (e.deltaMode == 0 ? 0.1 : 2)
		if(e.target.tagName == "CANVAS") {
			if(this.classList.contains("scroll-actions")){
				var w = (new parupaintCursor()).update(brushglass.size(brushglass.size() - y)).size();
				// Update cache and push out new width
				if(parupaint.net && parupaint.net.socket.connected){
					parupaint.net.socket.emit('draw', netcache.update({w: w}));
				}
				e.preventDefault();
				return false;
			}
		}
	});
	var buttons = document.querySelector(".oekaki-buttons");
	if(buttons){
		buttons.clickButton = function(inputname, func){
			this.querySelector('button[name="' + inputname + '"]').onclick = func;
		};
		buttons.onmouseenter = function(){
			(new parupaintCursor()).x("50%").y("50%");
		}
		buttons.clickButton("e", function(){
			(new parupaintCursor()).update(brushglass.brush(1));
		});
		buttons.clickButton("b", function(){
			(new parupaintCursor()).update(brushglass.brush(0));
		});
		buttons.clickButton("bd", function(){
			(new parupaintCursor()).update(brushglass.size(brushglass.size() - 2));
		});
		buttons.clickButton("bi", function(){
			(new parupaintCursor()).update(brushglass.size(brushglass.size() + 2));
		});
		buttons.clickButton("c", function(){
			parupaintCanvas.clear(document.querySelector(".canvas-pool > canvas.main"), "#00000000");
		});
	}

	parupaintCanvas.init();
	if(parupaintConfig.connect_on_load === true){
		parupaint.net = new parupaintNetwork(parupaintConfig.ws_host);
	}
});
