var overlayTimeout = null;
var overlayGone = function(){
	$('.overlay .gui').removeClass('visible');
};

$(document).keydown(function(e){
	switch(e.keyCode){
			case 9:
			{
				if(!$('.overlay .gui').hasClass('visible')){
					$('.overlay .gui').addClass('visible');
				}
				if(e.shiftKey){
					overlayGone();
				}else{
					clearTimeout(overlayTimeout);
					overlayTimeout = setTimeout(overlayGone, 2000);
				}
				break;
			}
			case 116:
			{
				return chrome.runtime.reload()
			}
	}
})


function hex2rgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
	var alpha = 255
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	if(result[4]) alpha = parseInt(result[4], 16)
	
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha
    } : null;
}

var drawCanvasLine = function(canvas, x1, y1, x2, y2, color, width){
	if(canvas == null){
		canvas = $('canvas.focused')
	}
	
	if(canvas.length)
	{
		var ctx = canvas[0].getContext('2d');
		
		
		var composite = ctx.globalCompositeOperation;
		var col = hex2rgb(color);
		
		if(!col.a) {
			ctx.globalCompositeOperation = "destination-out";
			col.a = 255;
		}
		ctx.strokeStyle = 'rgba('+col.r+','+col.g+','+col.b+','+(col.a/255.0)+')'
		
		ctx.lineWidth = width;
		ctx.lineCap = 'round';

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

		ctx.globalCompositeOperation = composite;


	}
}


var tsettings = {
	tmoving:false,
	
	beraser:3,
	bmove:2,
	
	cbrush:0,
	brushes:[
		{size:1, color:'#000'},
		{size:16, color:'#00000000'}
	],
	brush: function(b){
		if(b != undefined) 	this.cbrush = b;
		return this.brushes[this.cbrush];
	}
}



var failSafe = function(){
	
}


var writeDefaults = function(){
	chrome.storage.local.set({brushDefaults: JSON.stringify(tsettings.brushes)}, failSafe);
}

var cursorSize = function(cursor, size){
	if(cursor == null){
		cursor = $('.canvas-cursor.cursor-self');
	}
	if(cursor.length){
		cursor.data('size', size);
		cursor.css({width: size, height:size})
		tsettings.brush().size = size;
		
	}
}
var cursorColor = function(cursor, color){
	if(cursor == null){
		cursor = $('.canvas-cursor.cursor-self');
	}
	if(cursor.length){
		cursor.data('color', color);
		cursor.css({borderColor: color, backgroundColor: color})
		tsettings.brush().color = color;
	}
}

var cursorUpdate = function(){
	
	var cursor = $('.canvas-cursor.cursor-self')
	cursorSize(cursor, tsettings.brush().size)
	cursorColor(cursor, tsettings.brush().color)
	cursor.removeClass('eraser drawing')
	if(tsettings.cbrush == 1){
		cursor.addClass('eraser')
	}
}



var saveCanvasLocal = function(r){
	if(r == undefined) r = 'default'
	chrome.storage.local.get('rooms', function(roomdata){
		
		var d = roomdata.length ? roomdata.rooms : undefined;

		if(d == undefined) 		d = {};
		if(d[r] == undefined)	d[r] = {};
		
		console.log('Saving ['+r+']...')
		
		
		var pool = $('.canvas-pool').children();
		if(pool.length){
			d[r].width = $('#flayer-0-0')[0].width;
			d[r].height = $('#flayer-0-0')[0].height;
			d[r].data = [];
			
			for(var l = 0; l < pool.length; l++){
				
				if(!$('#flayer-' + l + '-0').length) break;
				
				if(d[r].data[l] == undefined) d[r].data[l] = [];
				
				for(var f = 0; f < pool.length; f++){
					var flayer = $('#flayer-' + l + '-' + f)
					if(!flayer.length) break;
					
					if(d[r].data[l][f] == undefined) d[r].data[l][f] = {data:null};
				//	someday, when chrome allows saving with array...
				//	d[r].data[l][f].data = ''
				//	d[r].data[l][f].data = flayer[0].getContext('2d').getImageData(0, 0, flayer[0].width, flayer[0].height).data;
					d[r].data[l][f].data = flayer[0].toDataURL();
					console.log()
				}
			}
		}
		chrome.storage.local.set({rooms: d}, function(){
			console.log('Finish writing')					 
		});
	});
}



onRoom = function(room){
	chrome.storage.local.get(null, function(data){
		
		if(data.brushDefaults){
			var def = JSON.parse(data.brushDefaults);
			tsettings.brushes = def;
			cursorUpdate()
		}
		
		
		
		
		if(data.rooms[room].data){
			console.log('Room is saved.', data.rooms[room].data)
			var layers = []
			for(var l in data.rooms[room].data){
				layers[l] = data.rooms[room].data[l].length
			}
			var w = data.rooms[room].width || 500,
				h = data.rooms[room].height || 500
			
			initCanvas(w, h, layers.length, layers)
			for(var l in data.rooms[room].data){
				for(var f in data.rooms[room].data[l]){
					var cc = data.rooms[room].data[l][f];
					var nc = $('#flayer-' + l + '-' + f)
					if(nc.length){
						
						var img = new Image
						img.src = cc.data
						nc[0].getContext('2d').drawImage(img, 0, 0);
					}
				}
			}
			
			
		} else {
			console.log('New canvas')
			initCanvas(500, 500, 1, [1])
		}
		
		
		
		
		
		// real init
		
		
		updateCallbacks(function(e, data){

			if(e == 'mousemove'){	

				var drawing = (data.button == 1);
				var moving = (tsettings.tmoving || data.button == tsettings.bmove);

				//todo: store with zoom offset
				tsettings.mx = data.x;
				tsettings.my = data.y;
				var cursor = $('.canvas-cursor.cursor-self');
				if(cursor.length){
					var left = parseInt(cursor.css('left')), top = parseInt(cursor.css('top'));
					var dx = (data.x - left), dy = (data.y - top);
					var dist = Math.sqrt(dx*dx + dy*dy)
					if(dist > (drawing ? 2 : 15)){
						cursor.css({left: data.x, top:data.y});
					}
				}
				if(moving){
					var b = $('body');
					b.scrollLeft(b.scrollLeft() - data.sx);
					b.scrollTop(b.scrollTop() - data.sy);
				}
				else if(drawing){

					var nx1 = ((data.x - data.cx));
					var ny1 = ((data.y - data.cy));
					var nx2 = ((data.x));
					var ny2 = ((data.y));
					var s = parseInt(cursor.data('size')) || tsettings.brush().size;
					var c = cursor.data('color') || tsettings.brush().color;

					drawCanvasLine(null, nx1, ny1, nx2, ny2, c, s)
				}
			}else if(e == 'mousedown'){
				if(data.button == tsettings.beraser){
					var newbrush = tsettings.cbrush == 0 ? 1 : 0;
					tsettings.brush(newbrush)
					cursorUpdate()
				}
				else if(data.button == 1){
					$('.canvas-cursor.cursor-self').addClass('drawing')
				}
			}else if(e == 'mouseup'){
				if(data.button == 1){


					$('.canvas-cursor.cursor-self').removeClass('drawing')
					saveCanvasLocal(room);


				}
			} else if(e == 'mousewheel'){
				var a = data.scroll > 0 ? 2 : 0.5;
				var cursor = $('.canvas-cursor.cursor-self')
				var s = parseInt(cursor.data('size'))
				s *= a;
				if(s < 1) s = 1;
				if(s > 256) s = 256;

				cursorSize(cursor, s);
				writeDefaults()

				return false;
			} else if(e == 'keydown'){
				console.log(data.key)

				switch(data.key){
						case 82:
						{
							if(!$('.canvas-cursor.cursor-self').hasClass('pick-color')){
								$('.canvas-cursor.cursor-self').addClass('pick-color')
							}
							var cc = $('canvas.focused');
							if(cc.length){
							//	var x = parseInt($('.canvas-cursor.cursor-self').css('left')),
							//		y = parseInt($('.canvas-cursor.cursor-self').css('top'))
								var x = tsettings.mx, y = tsettings.my;	

								var px = cc[0].getContext('2d').getImageData(x, y, 1, 1).data;
								var r = ('00' + px[0].toString(16)).slice(-2),
									g = ('00' + px[1].toString(16)).slice(-2),
									b = ('00' + px[2].toString(16)).slice(-2),
									a = ('00' + px[3].toString(16)).slice(-2)
								var hex = "#" + ("00000000" + (r+g+b+a)).slice(-8);
								cursorColor(null, hex)
								writeDefaults();
							}
							break;
						}
						case 32:
						{
							return !(tsettings.tmoving = true)
						}
				}
			} else if(e == 'keyup'){
				if(data.key == 82){
					$('.canvas-cursor.cursor-self').removeClass('pick-color')
				}
				if(data.key == 32){
					tsettings.tmoving = false;
					return false;
				}
			}
		});
	});
	
	
	
	
	
	
	
	
	
}
