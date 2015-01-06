var getStorageKey = function(key, callback){
	if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined'){
		return chrome.storage.local.get(key, callback)
	} else {
		var a = {};
		a[key] = localStorage.getItem(key);
		if(key == null){
			a = localStorage;
		}
		if(typeof callback == 'function'){
			return callback(a);
		}
		return a;
	}
}
var setStorageKey = function(key, callback){
	if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined'){
		return chrome.storage.local.set(key, callback)
	} else {
		for (var i in key){
			localStorage.setItem(i, key[i]);
		}
		if(typeof callback == 'function') return callback();
		return true;
	}
}
var clearStorage = function(){
	if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined'){
		chrome.storage.local.clear()
	} else {
		localStorage.clear();
	}
}




jQuery.fn.extend({
	sevent: function(callback) {
		return this.each(function(k, e) {
			var mb = 0, tmouse = {};

			$(e).unbind().bind('mousemove mousedown', function(e){
				if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
				if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
				if(callback){
					if(tmouse.oldx === undefined) tmouse.oldx = e.offsetX;
					if(tmouse.oldy === undefined) tmouse.oldy = e.offsetY;
					if(tmouse.oldsx === undefined) tmouse.oldsx = e.clientX;
					if(tmouse.oldsy === undefined) tmouse.oldsy = e.clientY;

					var cx = (e.offsetX - tmouse.oldx);
					var cy = (e.offsetY - tmouse.oldy);
					tmouse.oldx = e.offsetX;
					tmouse.oldy = e.offsetY;

					var csx = (e.clientX - tmouse.oldsx);
					var csy = (e.clientY - tmouse.oldsy);
					tmouse.oldsx = e.clientX;
					tmouse.oldsy = e.clientY;
                    
					return callback('mousemove', {
                        button: mb, 
                        x: e.offsetX + document.documentElement.scrollLeft, y: e.offsetY + document.documentElement.scrollTop, 
                        
                        xpage: e.pageX, ypage: e.pageY, 
                        cx: cx, cy: cy, sx: csx, sy: csy, 
                        xclient:e.clientX, yclient:e.clientY, target: e.target, 
                        mozPressure: e.mozPressure});

				}
			}).mouseenter(function(e){
				if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
				if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
				
				if(callback){
					if(tmouse.oldx === undefined) tmouse.oldx = e.offsetX;
					if(tmouse.oldy === undefined) tmouse.oldy = e.offsetY;
					mb = (e.buttons != undefined ? e.buttons : e.which)
					return callback('mouseenter', {button: (e.which || e.button), x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY, xclient:e.clientX, yclient:e.clientY, target: e.target});
				}
			}).mouseout(function(e){
				if(callback){
					tmouse.oldx = undefined;
					tmouse.oldy = undefined;
					return callback('mouseout', {button: (e.which || e.button), x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY, xclient:e.clientX, yclient:e.clientY, target: e.target});
				}
			}).mousedown(function(e){
				if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
				if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
				if(callback){
					tmouse.oldx = e.offsetX;
					tmouse.oldy = e.offsetY;
					mb = e.which
					return callback('mousedown', {button: e.which, x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY, xclient:e.clientX, yclient:e.clientY, target: e.target});
				}
			}).mouseup(function(e){
				if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
				if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
				if(callback){
					tmouse.oldx = e.offsetX;
					tmouse.oldy = e.offsetY;
					mb = 0
					return callback('mouseup', {button: e.which, x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY, xclient:e.clientX, yclient:e.clientY, target: e.target});
				}
			}).keydown(function(e){
				if(callback){
					return callback('keydown', {key: e.keyCode, shift:e.shiftKey, ctrl:e.ctrlKey});
				}
			}).keyup(function(e){
				if(callback){
					return callback('keyup', {key: e.keyCode, shift:e.shiftKey, ctrl:e.ctrlKey});
				}
			}).bind('mousewheel DOMMouseScroll', function(e){

				var wd = e.originalEvent.wheelDelta / 100;
				var ed = e.originalEvent.detail * -1;
				if(wd || ed) return callback('mousewheel', {scroll: wd || ed, target: e.target})

			}).on('paste', function(e){
				if(callback){
					return callback('paste', {clipdata: (e.originalEvent || e).clipboardData})
				}
			})

		})
	}
})
