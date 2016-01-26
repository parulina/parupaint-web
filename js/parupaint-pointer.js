var parupaintPointerEvents = function(canvas){

	// Common functions for pointerMove events
	var buttons = [false, false, false, false];
	var tracking_draw = {
		type: null,
		startpoints: {}
	};

	this.onMove = function(e){};
	var pthis = this;

	this.pointerDown = function(e){
		var b = e.which;
		buttons[b] = true;

		if(e.target.tagName == "CANVAS") {
			if(buttons[3]){
				(new parupaintCursor()).update(parupaint.brushglass.brush(parupaint.brushglass.opposite()));
				return e.preventDefault();

			} else if(buttons[2]){
				return e.preventDefault();
			}
		}
	};
	this.pointerUp = function(e){
		var b = e.which;
		buttons[b] = false;
	};
	this.pointerMove = function(e){
		if(e.target.tagName == "CANVAS") {
			var bcr = e.target.parentNode.getBoundingClientRect();
			var ax = e.clientX - (bcr.x || bcr.left),
			    ay = e.clientY - (bcr.y || bcr.top);

			var cur = (new parupaintCursor());
			var mx = e.movementX, my = e.movementY;
			var pp = (typeof e.pressure == "number" ? e.pressure : 1.0);

			if(e.type == "pointermove"){
				// movementX in pointermove is for some reason absolute coords.
				mx = ax - cur.x();
				my = ay - cur.y();
				if(e.pointerType == "mouse" || e.mozPressure === 0.5){
					pp = 1.0;
				}
			}
			var api = document.getElementById("tablet-api");
			if(api && (api = api.penAPI)){
				if(api.pointerType == 1){
					pp = api.pressure;
				}
			}
			cur.x(ax).y(ay);
			var ox = ax - mx, oy = ay - my;
			var d = {canvas: e.target, ox: ox, oy: oy, mx: mx, my: my, x: ax, y: ay, p: pp, b: buttons};

			pthis.onMove(d);
		}
	};

	if(window.PointerEvent){
		console.info("Using pointer events.");
		canvas.onpointerdown = this.pointerDown;
		canvas.onpointermove = this.pointerMove;
		canvas.onpointerup = this.pointerUp;
	} else {
		canvas.onmousedown = this.pointerDown;
		canvas.onmousemove = this.pointerMove;
		canvas.onmouseup = this.pointerUp;
	}
	if(navigator.plugins && navigator.plugins.WacomTabletPlugin){
		var t = navigator.plugins.WacomTabletPlugin;
		var w = document.createElement("object");
		w.type = t[0].type;
		w.id = "tablet-api";
		document.body.appendChild(w);
	}

	canvas.addEventListener("touchstart", function(e){
		if(e.target.tagName == "CANVAS"){
			if(e.touches.length == 1){
				var t = e.touches[0];
				tracking_draw.startpoints[t.identifier] = {
					x: t.clientX,
					y: t.clientY
				};
				tracking_draw.type = "move";
			}
			if(e.touches.length >= 2){
				var t = e.touches[1];
				tracking_draw.startpoints[t.identifier] = {
					x: t.clientX,
					y: t.clientY,
					d: 0
				};
				var bcr = t.target.parentNode.getBoundingClientRect();
				(new parupaintCursor()).x(t.clientX - (bcr.x || bcr.left)).y(t.clientY - (bcr.y || bcr.top));
				if(tracking_draw.type != "drawing") tracking_draw.type = "hold";
				e.preventDefault();
			}
		}
	});
	canvas.addEventListener("touchend", function(e){
		var t = e.changedTouches[0];
		if(tracking_draw.startpoints[t.identifier]){
			delete tracking_draw.startpoints[t.identifier];
		}
		if(e.touches.length == 1 && tracking_draw.type == "drawing"){
			if(parupaint.net && parupaint.net.socket.connected){
				(new parupaintCursor()).drawing(false);
				var a = netcache.update({d: false});
				a.d = false;
				parupaint.net.socket.emit('draw', a);
			}
		}
		if(e.touches.length == 0){
			// to clear up other vars
			delete tracking_draw.origin;
			tracking_draw.type = null;
		}
	});
	canvas.addEventListener("touchmove", function(e){

		if(e.targetTouches.length == 2 && tracking_draw.type == "hold"){
			for(var i = 0; i < e.changedTouches.length; i++){
				var t = e.changedTouches[i];
				var x = t.clientX - tracking_draw.startpoints[t.identifier].x,
				    y = t.clientY - tracking_draw.startpoints[t.identifier].y;
				var d = Math.sqrt(x * x + y * y);
				tracking_draw.startpoints[t.identifier].d = d;
				if(d > 20) {
					if(t.identifier == 1){
						tracking_draw.type = "drawing";
					} else if(t.identifier == 0){
						tracking_draw.type = "sizing";
					}
					var op = t.identifier == 1 ? 0 : 1;
					if(tracking_draw.startpoints[op].d > 15){
						tracking_draw.type = "zooming";
						document.getElementById("debug").innerHTML = "Zooming canvas";
					}

					tracking_draw.origin = new function(){
						this.p1 = (tracking_draw.type == "drawing" ? 0 : 1);
						this.p2 = (tracking_draw.type == "drawing" ? 1 : 0);

						this.x = tracking_draw.startpoints[this.p1].x;
						this.y = tracking_draw.startpoints[this.p1].y;
					};
					if(tracking_draw.type == "sizing"){
						tracking_draw.origin.size = (new parupaintCursor()).size();
					}
				}
			}
			return false;
		}
		if(tracking_draw.type == "sizing" || tracking_draw.type == "drawing"){
			var p = tracking_draw.origin.p2;
			if(e.touches.length == 1) p = 0;
			if(e.touches.length == 1 && tracking_draw.type == "drawing") return;

			if(e.touches.length >= p){
				var t = e.touches[p];

				var bcr = t.target.parentNode.getBoundingClientRect();
				if(tracking_draw.type == "sizing"){
					var x = t.clientX - tracking_draw.origin.x,
					    y = t.clientY - tracking_draw.origin.y;
					var d = Math.sqrt(x * x + y * y);
					var s = (parseInt(d) / 100) * tracking_draw.origin.size;
					if(s < 1) s = 1;

					x = (tracking_draw.origin.x + x/2) - (bcr.x || bcr.left);
					y = (tracking_draw.origin.y + y/2) - (bcr.y || bcr.top);

					(new parupaintCursor()).update(parupaint.brushglass.size(s)).x(x).y(y);

				} else if(tracking_draw.type == "drawing") {
					var ax = t.clientX - (bcr.x || bcr.left),
					    ay = t.clientY - (bcr.y || bcr.top);
					var cur = new parupaintCursor();
					var ox = cur.x(), oy = cur.y();
					var d = {
						canvas: t.target,
						ox: ox, oy: oy, x: ax, y: ay,
						p: t.force, b: [false, false, false, false]
					};
					if(cur.drawing()){
						d.b[1] = true;
					}
					if(typeof t.radiusX == "number"){
						d.p = t.radiusX > 1 ? 1 : t.radiusX;
					}
					cur.x(ax).y(ay).drawing(true);
					pthis.onMove(d);
				}
			}
		}
	});
};
