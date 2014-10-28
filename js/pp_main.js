var url = 'http://sqnya.se:1108';

console.log('pp_main.js')


var loadSqnyaImage = function(url2, callback){
	var xhr = new XMLHttpRequest();
	xhr.responseType = 'blob';
	xhr.onload = function(){
		callback(window.URL.createObjectURL(xhr.response));
	}
	xhr.open('GET', url2, true); xhr.send();
}


var updateFrameinfoSlow = function(){
	var list = []
	$('.flayer-list').html('')
	
	$('.canvas-pool canvas[data-frame=0]').each(function(k, e){
		var l = $(e).data('layer')
		
		var fls = $('.flayer-list')
		if(fls.length){
			if(list[l] == undefined) list[l] = $('<div/>', {class: 'flayer-info-layer', 'data-layer':l, id:('list-flayer-' + l)})
			for(var f = 0; f < $('.canvas-pool canvas[data-layer='+l+']').length; f++){
				list[l].append($('<div/>', {class:'flayer-info-frame', id:('list-flayer-' + l + '-' + f), 'data-frame':f}))
			}
		}
	})
	for(var i = 0; i < list.length; i++){ //standard loop is important so that layers get in order
		$('.flayer-list').append(list[i])
	}
}

var updateRoomsTimer = null
var updateRooms = function(){
	if(typeof updateRoomsTimer == 'null') return false
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
				loadSqnyaImage(url + '/'+(r + '/image?' + Date.now()), function(url){
					ee.css('background-image', 'url('+url +')');
				})
				
			}
			ee.data('save', data.lastmod);
			
		}
		var ll = Object.keys(data2).length;
		$('.room-counter').html(ll + ' room'+(ll == 1 ? '' : 's')+' active');

		rest.remove();
		updateRoomsTimer = setTimeout(updateRooms, 3000);
	}).fail(function(err){
		console.log(err);
		$('.room-counter').html('Error contacting server ('+err+').');
	});
	
};


var focusCanvas = function(layer, frame){
	if(!$('.canvas-pool canvas[data-layer='+layer+'][data-frame='+frame+']').length) return false;
	$('.canvas-pool canvas').removeClass('focused partial-focused').filter('[data-frame='+frame+']').addClass('partial-focused').filter('[data-layer='+layer+']').addClass('focused');
	$('.qstatus-piece.qinfo').attr('data-label', layer).attr('data-label-2', frame)
	$('.flayer-list .flayer-info-frame').removeClass('focused')
	$('.flayer-list .flayer-info-layer[data-layer='+layer+'] .flayer-info-frame[data-frame='+frame+']').addClass('focused')
	return true;
}

var getStorageKey = function(key, callback){
	if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined'){
		return chrome.storage.local.get(key, callback)
	} else {
		return callback([])
	}
}
var setStorageKey = function(key, callback){
	if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined'){
		return chrome.storage.local.set(key, callback)
	} else {
		return callback([])
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
					return callback('mousemove', {button: mb, x: e.offsetX, y: e.offsetY, xpage: e.pageX, ypage: e.pageY, cx: cx, cy: cy, sx: csx, sy: csy, xclient:e.clientX, yclient:e.clientY, target: e.target});

				}
			}).mouseenter(function(e){
				if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
				if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
				
				if(callback){
					if(tmouse.oldx === undefined) tmouse.oldx = e.offsetX;
					if(tmouse.oldy === undefined) tmouse.oldy = e.offsetY;
					mb = e.which
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
				var ed = e.originalEvent.detail;
				if(wd || ed) return callback('mousewheel', {scroll: wd || ed, target: e.target})

			}).on('paste', function(e){
				if(callback){
					return callback('paste', {clipdata: (e.originalEvent || e).clipboardData})
				}
			})

		})
	}
})


//todo: spectate mode


initParupaint = function(room){
	document.title = 'Starting up...';
	
	clearTimeout(updateRoomsTimer), updateRoomsTimer = null
	if(typeof ROOM != 'undefined') delete ROOM
	
	$('body').removeClass('room canvas main').html('')
	
	if(!room){
		document.title = '-- parupaint home --';
		var title = $('<h1 class="title"></h1>').text('parupaint');
		var header = $('<h2></h2>').text('for chrome (beta)');
		var container = $('<div class="show-area"></div>');
        
        
			var tablet = $('<input/>', {type:'button', class: 'main-setting-panel set-tablet', value:'enable tablets', alt:'requests permission from you to turn on tablet support.'}),
				clear = $('<input/>', {type: 'button',class:'main-setting-panel clear-settings', value:'clear settings', alt:"clears the saved settings and rooms! you won't get them back."}),
				room2 = $('<div/>', {class: 'main-setting-panel set-room'}).html($('<input/>', {type: 'text', class: 'new-room-input'})),
				name2 = $('<div/>', {class: 'main-setting-panel set-name'}).html($('<input/>', {type: 'text', class: 'name-input'})),
				ctablet = $('<div/>', {class: 'chosen-tablet'}).text(tabletConnection.connections ? tabletConnection.connections + ' tablets' : 'None')
			
			
		var settings = $('<div/>', {class: 'main-page-settings'}).append(ctablet).append(tablet).append(clear).append(name2).append(room2)
		
		var roomstatus = $('<div class="room-status-bar"></div>').append($('<div/>', {class: 'room-counter'}));
		
		var infoheader = $('<div class="room-info-header"></div>').append(settings).append(title).append(header);
		
		getStorageKey('name', function(d){
			if(d && d.name){
				$('.main-setting-panel.set-name input').val(d.name)
			}
		})
		
		chrome.permissions.contains({permissions:['hid']}, function(e){
			if(e){
				$('input.set-tablet').addClass('enabled')
			}
		})
		
		$('body').addClass('main')
		$('body').append(infoheader).append(roomstatus).append(container);
		
		$('input.set-tablet').click(function(e){
			
			
			chrome.permissions.contains({permissions:['hid']}, function(e){
				if(e){
					chrome.permissions.remove({permissions:['hid']}, function(){
						$('input.set-tablet').removeClass('enabled')
					})
				} else {
					chrome.permissions.request({permissions:['hid']}, function(r){
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
		
		updateRooms()
	} else {
		
		
		
		
		
		
		document.title = ''+room+' (offline)';
		var canvaspool = $('<div class="canvas-pool"></div>');
		var self = $('<div/>', {class: "canvas-cursor cursor-self"}).append($('<div />', {class: 'cursor-pressure-size'}));
		var canvasworkarea = $('<div id="mouse-pool" class="canvas-workarea" tabindex="1"></div>').append(canvaspool).append(self);
		
		
		var overlay = $('<div class="overlay"></div>');
			var oqstatus = $('<div class="qstatus overlay-piece visible"></div>')
				var oqstatus_brush = $('<div/>', {class: 'qstatus-brush', title:'[#artists] - [current brush]'}).append($('<div/>', {class: 'qstatus-piece preview-col'})).append($('<div/>', {class: 'qstatus-panel brush-panel'}))
				var oqstatus_message = $('<div/>', {class: 'qstatus-message', title:'↡ pull down for overlay ↡'})
				
					//todo: oqstatus_internet should have status for current room and internet
				
						var exitbtn = $('<div/>', {tabindex:'3',type:'button', class:'setting-quit-btn', 'data-label':'quit'}),
							dwnbtn = $('<div/>', {type:'button', class:'setting-down-img', 'data-label':'download image'}),
							rldbtn = $('<div/>', {type:'button', class:'setting-reload-img multi-only', 'data-label':'reload'}),
							savebtn = $('<div/>', {type:'button', class:'setting-save-img', 'data-label':'save'})
						
						var minput = function(f, li){
							var a = $('<form/>', f)
							li.forEach(function(e, k){
								a.append($('<input/>', e))
							})
							return a
						}
						
						var rez = minput({class: 'dimension-input admin-only'}, [
							{class: 'dimension-confirm', type:'submit', value:'Set dimensions'},
							{class: 'dimension-w-input', type: 'number', min: '0', max: '4096'},
							{class: 'dimension-h-input', type: 'number', min: '0', max: '4096'}
						])
						
						
						var con = minput({class: 'connection-input knob-thing'}, [
							{class: 'con-status', type: 'checkbox'}
						])
						var priv = minput({class: 'private-input knob-thing multi-only admin-only', 'data-label': 'Private'}, [
							{class: 'private-status', type: 'checkbox'}
						])
						
				
						var toprow = $('<div/>', {class:'setting-top-row'}),
							middlerow = $('<div/>', {class: 'setting-middle-row'}),
							bottomrow = $('<div/>', {class: 'setting-bottom-row'})
						
						bottomrow.append(dwnbtn, rldbtn, savebtn, exitbtn)
						middlerow.append(con, priv, rez)
						
					var panel = $('<div/>', {class: 'qstatus-panel setting-panel'}).append(toprow, middlerow, bottomrow)
				var oqstatus_internet = $('<div/>', {class: 'qstatus-settings', title:'[layer] - [frame] - [connected]'}).append($('<div/>', {class: 'qstatus-piece qinfo'}), panel)
			oqstatus.append(oqstatus_brush, oqstatus_message, oqstatus_internet);
			
			var info = $('<div/>', {class: 'gui visible'})
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
				
		
			var flalist = $('<div/>', {class: 'flayer-list-container overlay-piece'}),
				flacontainer = $('<div/>', {class: 'flayer-list'}),
				flainfo = $('<div/>', {class: 'flayer-info'})
			flalist.append(flainfo).append(flacontainer)
		
		
			info.append(cspinner).append(chatbox).append(flalist);
		
		
		
		overlay.append(info).append(oqstatus);
		
		
		var drawarea = $('<div class="draw-main-area"></div>').append(canvasworkarea).append(overlay)
		
		$('body').removeClass('room main').addClass('canvas').html('');
		$('body').append(canvasworkarea).append(overlay);
		
		document.location.hash = room
		
		
		
		if(onRoom){
			ROOM = new onRoom(room);
		}
	}
	
};

var getRoom = function(){
	return document.location.hash.substr(1)
}















