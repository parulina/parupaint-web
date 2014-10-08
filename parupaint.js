var manifest = chrome.runtime.getManifest();
var url = 'http://draw.sqnya.se';
var hidperm = { permissions: ['hid'] }


var loadSqnyaImage = function(url2, callback){
	var xhr = new XMLHttpRequest();
	xhr.responseType = 'blob';
	xhr.onload = function(){
		callback(window.URL.createObjectURL(xhr.response));
	}
	xhr.open('GET', url + url2, true); xhr.send();
}


var updateRooms = function(){
	var jj = $.ajax(url + '/info').done(function(data2) {
		
		// get all current room children
		var rest = $('div.show-area').children();
		for(var r in data2)
		{
			var data = data2[r];
			
			var ee = $('#room-' + r);
			if(!ee.length){
				// doesn't room exist? add it
				console.log('added new room ' + r);
				ee = $('<a id="room-'+r+'" class="room-link" data-save="'+(data.lastmod-1)+'">'+r+'</a>')
				$('div.show-area').append(ee);
			}
			// get last mod
			var ss = ee.data('save');
			// filter it out
			rest = rest.not('#room-' + r); 
			var aaa = "";
			if(true)
			{
				var ccc = '';
				for(var c in data.ids){
					ccc += '<li>'+data.ids[c].name+'</li>';
				}
				var active = $('<div class="room-active">last active <span></span></div>');
				active.children('span').livestamp(Math.round(data.lastmod/1000));
				var header = $('<h3></h3>').html(r);
				var list = $('<ul>'+ccc+'</ul>');

				aaa = $('<div class="room-info"></div>').append(active).append(header).append(list);
			}
			ee.html(aaa);
			if(ss != data.lastmod){
				loadSqnyaImage('/'+(r + '/image?' + Date.now()), function(url){
					ee.css('background-image', 'url('+url +')');
				})
				
			}
			ee.data('save', data.lastmod);
			
		}
		var ll = Object.keys(data2).length;
		$('.room-counter').html(ll + ' room'+(ll == 1 ? '' : 's')+' active');

		rest.remove();
		setTimeout(updateRooms, 1000);
	}).fail(function(err){
		console.log(err);
		$('.room-counter').html('Error contacting server ('+err+').');
	});
	
};


var focusCanvas = function(layer, frame){
	
	$('canvas').removeClass('focused partial-focused').filter('[data-frame='+frame+']').addClass('partial-focused').filter('[data-layer='+layer+']').addClass('focused');
	$('.qstatus-piece.qinfo').attr('data-label', layer).attr('data-label-2', frame)
}

var advanceCanvas = function(nlayer, nframe){
	var canvas = $('canvas.focused')
	if(canvas.length){
		var layer = canvas.data('layer'),
			frame = canvas.data('frame'),
			maxlayers = $('canvas[data-frame='+frame+']').length,
			maxframes = $('canvas[data-layer='+layer+']').length
		if(typeof nlayer == "number"){
			var nl = (layer + nlayer >= maxlayers ? ((layer + nlayer) % maxlayers) : layer + nlayer)
			var cc = $('canvas[data-frame='+frame+'][data-layer='+nl+']')
			if(cc.length){
				focusCanvas(nl, frame)
			}
		}
		if(typeof nframe == "number"){
			var nf = (frame + nframe >= maxframes ? ((frame + nframe) % maxframes) : frame + nframe)
			var cc = $('canvas[data-frame='+nf+'][data-layer='+layer+']')
			if(cc.length){
				focusCanvas(layer, nf)
			}
		}
	}
	
}


// empty layers & frames for resize
//		       				tnt     int	    0-x		[0-x]
var initCanvas = function(width, height, layers, frames){
	
	var nn = (layers != undefined && frames != undefined)
	
	$('.canvas-workarea').width(width).height(height)
	$('.canvas-pool').data('ow', width).data('oh', height);
	if(nn){
		$('.canvas-pool').html('')
		for(var l = 0; l < layers; l++){
			for(var f = 0; f < frames[l]; f++){
				var id = 'flayer-'+l+'-'+f;

				var nc = $('<canvas width="'+width+'" height="'+height+'" id="'+id+'" data-layer="'+l+'" data-frame="'+f+'"></canvas>')
				nc[0].getContext('2d').webkitImageSmoothingEnabled = false;
				$('.canvas-pool').append(nc)

			}
		}
		focusCanvas(0, 0);
	} else {
		$('.canvas-pool').children('canvas').each(function(k, e){
			var nc = $(e)
			if(nc.length){
				nc[0].width = width;
				nc[0].height = height;
			}	
		});
		
	}
}

var tmouse = {};

var updateCallbacks = function(cb){
	console.log('setting callbacks for pool');
	
	var pool = $('#mouse-pool');
	pool.unbind();
	pool.bind('mousemove mousedown', function(e){
		//console.log(e)
		if(cb){
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
			
			return cb('mousemove', {button: (e.which || e.button), x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY, cx: cx, cy: cy, sx: csx, sy: csy});
			
		}
	}).mouseout(function(e){
		if(cb){
			tmouse.oldx = undefined;
			tmouse.oldy = undefined;
			return cb('mouseout', {button: (e.which || e.button), x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY});
		}
	}).mousedown(function(e){
		if(cb){
			tmouse.oldx = e.offsetX;
			tmouse.oldy = e.offsetY;
			return cb('mousedown', {button: e.which, x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY});
		}
	}).mouseup(function(e){
		if(cb){
			tmouse.oldx = e.offsetX;
			tmouse.oldy = e.offsetY;
			return cb('mouseup', {button: (e.which || e.button), x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY});
		}
	}).keydown(function(e){
		if(cb){
			return cb('keydown', {key: e.keyCode, shift:e.shiftKey, ctrl:e.ctrlKey});
		}
	}).keyup(function(e){
		if(cb){
			return cb('keyup', {key: e.keyCode, shift:e.shiftKey, ctrl:e.ctrlKey});
		}
	}).bind('contextmenu', function(e) {
		return false;
	}).bind('mousewheel DOMMouseScroll', function(e){
        
		var wd = e.originalEvent.wheelDelta / 100;
		var ed = e.originalEvent.detail;
		if(wd || ed) return cb('mousewheel', {scroll: wd || ed})
		
    })
}




//todo: spectate mode


var initParupaint = function(room){
	document.title = 'Starting up...';
	
	clearTimeout(updateRooms);
	
	if(!room){
		document.title = '-- parupaint home --';
		var title = $('<h1 class="title"></h1>').text('parupaint');
		var header = $('<h2></h2>').text('for chrome (beta)');
		var container = $('<div class="show-area"></div>');
        
        
			var tablet = $('<input/>', {type:'button', class: 'main-setting-panel set-tablet', value:'enable tablets', alt:'requests permission from you to turn on tablet support.'}),
				clear = $('<input/>', {type: 'button',class:'main-setting-panel clear-settings', value:'clear settings', alt:"clears the saved settings and rooms! you won't get them back."}),
				room2 = $('<div/>', {class: 'main-setting-panel set-room'}).html($('<input/>', {type: 'text', class: 'new-room-input'})),
				name2 = $('<div/>', {class: 'main-setting-panel set-name'}).html($('<input/>', {type: 'text', class: 'name-input'})),
				ctablet = $('<div/>', {class: 'chosen-tablet'})
			
			
		var settings = $('<div/>', {class: 'main-page-settings'}).append(ctablet).append(tablet).append(clear).append(name2).append(room2)
		
		var roomstatus = $('<div class="room-status-bar"></div>').append($('<div/>', {class: 'room-counter'}));
		
		var infoheader = $('<div class="room-info-header"></div>').append(settings).append(title).append(header);
		
		
		
		chrome.storage.local.get('last_tablet', function(d){
			if(d && d.last_tablet){
				 $('.chosen-tablet').text((d.last_tablet.name || 'Mouse/unknown'))
			}
		})
		chrome.permissions.contains(hidperm, function(e){
			if(e){
				$('input.set-tablet').addClass('enabled')
			}
		})
		
		$('body').removeClass('room canvas').addClass('main').html('');
		$('body').append(infoheader).append(roomstatus).append(container);
		
		$('input.set-tablet').click(function(e){
			
			
			chrome.permissions.contains(hidperm, function(e){
				if(e){
					chrome.permissions.remove(hidperm, function(){
						$('input.set-tablet').removeClass('enabled')
					})
				} else {
					chrome.permissions.request(hidperm, function(r){
						if(r){
							$('input.set-tablet').addClass('enabled')
						}
					})
				}
			})
		})
		$('input.clear-settings').click(function(e){
			
			chrome.storage.local.clear()
		})
		
		$('input.new-room-input').keypress(function(e){
			if(e.keyCode == 13){
				chrome.storage.local.get('name', function(d){
					if(d && d.name && d.name.length){
						
						initParupaint($(e.target).val());
						$(e.target).val('');
					} else {
						console.log("name isn't valid!",d)
						return $('input.name-input').focus().select()
					}
				})
			}
		});
		$('input.name-input').keypress(function(e){
			if(e.keyCode == 13){
				chrome.storage.local.set({name: $(this).val()})
				console.log('set name to: ', $(this).val())
			}
		});
		
		setTimeout(updateRooms, 1000);
	} else {
		
		
		
		
		
		
		document.title = ''+room+' (offline)';
		var canvaspool = $('<div class="canvas-pool"></div>');
		var self = $('<div class="canvas-cursor cursor-self admin"></div>');
		var canvasworkarea = $('<div id="mouse-pool" class="canvas-workarea" tabindex="1"></div>').append(canvaspool).append(self);
		
		
		var overlay = $('<div class="overlay"></div>');
			var oqstatus = $('<div class="qstatus overlay-piece visible"></div>')
				var oqstatus_brush = $('<div class="qstatus-brush"></div>').append($('<div/>', {class: 'qstatus-piece preview-col'})).append($('<div/>', {class: 'qstatus-panel brush-panel'}))
				var oqstatus_message = $('<div class="qstatus-message"></div>')
				
					//todo: oqstatus_internet should have status for current room and internet
				
						var exitbtn = $('<div/>', {tabindex:'3',type:'button', class:'setting-quit-btn', 'data-label':'quit'})
				
						var toprow = $('<div/>', {class:'setting-top-row'}),
							middlerow = $('<div/>', {class: 'setting-middle-row'}),
							bottomrow = $('<div/>', {class: 'setting-bottom-row'})
						
						bottomrow.append(exitbtn)
						
					var panel = $('<div/>', {class: 'qstatus-panel setting-panel'}).append(toprow).append(middlerow).append(bottomrow)
				var oqstatus_internet = $('<div class="qstatus-settings"></div>').append($('<div/>', {class: 'qstatus-piece qinfo'})).append(panel)
			oqstatus.append(oqstatus_brush).append(oqstatus_message).append(oqstatus_internet);
			
			var info = $('<div class="gui"></div>')
				var cspinner = $('<div class="color-spinner overlay-piece"></div>');
					
					var selectorcode = '<div class="color-selector"></div>';
					var preview = $('<div class="preview-col"></div>')
						
					var hue = $('<div class="hue-pick"></div>').html(preview).append(selectorcode)
					
					var lp = $('<div class="light-pick"></div>').html(selectorcode),
						sp = $('<div class="saturation-pick"></div>').html(selectorcode),
						ap = $('<div class="alpha-pick"></div>').html(selectorcode)
							
					var pick = $('<div class="hsl-select-pick"></div>').append(ap).append(lp).append(sp).append(hue)
					
					var palette = $('<div class="palette-storage"></div>')
				cspinner.append(pick).append(palette)
				
				var chatbox = $('<div class="chat-box overlay-piece"></div>');
					var chatcontent = $('<div class="chat-content"></div>')
					
					
						var chati = $('<textarea/>', {tabindex: '-1', class: 'chat-input'})
						var ssize = $('<div/>', {class: 'ci-size'})
					var chatinput = $('<div/>', {class: 'chat-input-box'}).append(chati).append(ssize)
					
				chatbox.append(chatcontent).append(chatinput)
				
		
		
		
			info.append(cspinner).append(chatbox);
		
		overlay.append(info).append(oqstatus);
		
		
		var drawarea = $('<div class="draw-main-area"></div>').append(canvasworkarea).append(overlay)
		
		$('body').removeClass('room main').addClass('canvas').html('');
		$('body').append(canvasworkarea).append(overlay);
		
		document.location.hash = room
		
		if(onRoom) onRoom(room);
	}
	
};

var getRoom = function(){
	return document.location.hash.substr(1)
}