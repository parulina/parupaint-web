var url = 'http://sqnya.se:1108';

console.log('pp_main.js')


var loadSqnyaImage = function(url2, callback){
	if(typeof chrome != "undefined" && typeof chrome.app != "undefined" && typeof chrome.app.runtime != "undefined"){
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'blob';
		xhr.onload = function(){
			callback(window.URL.createObjectURL(xhr.response));
		}
		xhr.open('GET', url2, true); xhr.send();	
	} else {
		callback(url2)
	}
	
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
    
    $('.room-counter').text('').removeAttr('href').removeClass('error').unbind('click')
    
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
				var m = data.lastmod-1;
				
				ee = $('<a/>', 
					   {
					id: 'room-' + r,
					class: 'room-link',
					'data-room': r,
					'data-save': m,
					href:'/#' + r
					   });
				
				$('div.show-area').append(ee);
				
				ee.click(function(){
					var hash = $(this).attr('data-room');
					initParupaint(hash);
					return false;
				})
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

				aaa = $('<div class="room-info"></div>').append(active, header, list);
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
		$('.room-counter').text(ll + ' room'+(ll == 1 ? '' : 's')+' active');

		rest.remove();
		updateRoomsTimer = setTimeout(updateRooms, 3000);
        
        
	}).error(function(xhr, ts, err){
        console.log(xhr, ts, err)
		$('.room-counter').text('Error contacting server ('+ ts +').').addClass('error').attr('href', '#').click(function(e){
            updateRooms()
        });
	});
	return false;
};


var focusCanvas = function(layer, frame){
	if(!$('.canvas-pool canvas[data-layer='+layer+'][data-frame='+frame+']').length) return false;
	$('.canvas-pool canvas').removeClass('focused partial-focused').filter('[data-frame='+frame+']').addClass('partial-focused').filter('[data-layer='+layer+']').addClass('focused');
	$('.qstatus-piece.qinfo').attr('data-label', layer).attr('data-label-2', frame)
	$('.flayer-list .flayer-info-frame').removeClass('focused')
	$('.flayer-list .flayer-info-layer[data-layer='+layer+'] .flayer-info-frame[data-frame='+frame+']').addClass('focused')
	return true;
}




initParupaint = function(room){
	document.title = 'Starting up...';
	console.log('initParupaint', room)
	
	clearTimeout(updateRoomsTimer), updateRoomsTimer = null
	if(typeof ROOM != 'undefined') {
		if(isConnected()){
			ROOM.roomSocket.socket.io.disconnect();
		}
		delete ROOM.roomSocket;
		delete ROOM.canvasCallbacks;
		delete ROOM;
	}
	
	
	window.location.hash = '';
	if(typeof room == 'string' && room.length){
		
		window.location.hash = '#' + room;
	}
	
	$('body').removeClass('room canvas main').html('')
	
	if(!room){
		document.title = '-- parupaint home --';
		var title = $('<h1 class="title"></h1>').text('parupaint');
		var header = $('<h2></h2>').text('for chrome (beta)');
		var container = $('<div class="show-area"></div>');
        
        
				
			
                
                
        // buttons/settings
                
        var tablet = $('<input/>', {
            type:'button',
            class: 'main-setting-panel set-tablet',
            value:'enable tablets',
            title:'requests permission from you to turn on tablet support.'
        }),
        clear = $('<input/>', {
            type: 'button', 
            class:'main-setting-panel clear-settings',
            value:'clear settings',
            title:"clears the saved settings and rooms! you won't get them back."
        }),
		settings = $('<div/>', {class: 'main-page-settings'}).append(tablet, clear)
		
        
        var tablets = $('<div/>', {class: 'chosen-tablet'}).text(
            tabletConnection.connections ? tabletConnection.connections + ' tablets connected' : 'No tablets connected'
        );
        
        
        //status and name input
		var roomstatus = $('<div class="room-status-bar"></div>').append(
            $('<a/>', {class: 'room-counter'}), 
            $('<input/>', {type: 'text', class: 'name-input', maxlength:24, placeholder: 'enter nickname', title: 'your nickname here!'})
        );
		
		// room input
		var rinput = $('<input/>', {placeholder: 'or, create a new room', type: 'text', class: 'new-room-input'});
        
        // put everything together
		var infoheader = $('<div/>', {class: "room-info-header"}).append(
            $('<div/>', {class: 'left-header-column header-column'}).append(title, header),
            $('<div/>', {class: 'middle-header-column header-column'}).append(settings, rinput),
            $('<div/>', {class: 'right-header-column header-column'}).append(tablets)
        );
		
        
		$('body').addClass('main').append(infoheader, roomstatus, container);
		
		
		
		
		if(typeof chrome != "undefined" && typeof chrome.permissions != "undefined"){
			chrome.permissions.contains({permissions:['hid']}, function(e){
				if(e){
					$('input.set-tablet').addClass('enabled')
				}
			})
		}
		
		
		$('input.set-tablet').click(function(e){
			
			
			if(typeof chrome != "undefined" && typeof chrome.permissions != "undefined"){
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
			}else {
				var a = confirm("Sorry, full tablet support isn't available on browsers yet.\nHowever, i can try to use Wacom's tablet plugin, but it is slightly outdated and might crash this site.\n\nDo you want to use it?")
                if(a){
                    setStorageKey({plugin: 'true'});
                }
			}
		})
		$('input.clear-settings').click(function(e){
			clearStorage();
		})
		
		$('input.new-room-input').keypress(function(e){
			if(e.keyCode == 13){
				
				getStorageKey('name', function(d){
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
				setStorageKey({name: $(this).val()})
				console.log('set name to: ', $(this).val())
                $('input.new-room-input').focus().select();
			}
		});
		
		
		
		getStorageKey('name', function(d){
			if(d && d.name){
				$('input.name-input').val(d.name)
			}
		})
		
		
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
						
						//note - labels need a working id.
						var minput = function(f, li){
							var a = $('<form/>', f)
							li.forEach(function(e, k){
								var l = $('<label/>')
								if(e.id) l.attr('for', e.id)
								a.append($('<input/>', e)).append(l)
							})
							return a
						}
						
						var rez = minput({class: 'dimension-input admin-only'}, [
							{class: 'dimension-confirm', type:'submit', value:'Set dimensions'},
							{class: 'dimension-w-input', type: 'number', min: '0', max: '4096'},
							{class: 'dimension-h-input', type: 'number', min: '0', max: '4096'}
						])
						
						
						var con = minput({class: 'connection-input knob-thing'}, [
							{class: 'con-status', type: 'checkbox', id: 'con-status-id'}
						])
						var priv = minput({class: 'private-input knob-thing multi-only admin-only', 'data-label': 'Private'}, [
							{class: 'private-status', type: 'checkbox', id: 'private-status-id'}
						])
						
				
						var toprow = $('<div/>', {class:'setting-top-row'}),
							middlerow = $('<div/>', {class: 'setting-middle-row'}),
							bottomrow = $('<div/>', {class: 'setting-bottom-row'})
						
						bottomrow.append(dwnbtn, rldbtn, savebtn, exitbtn)
						middlerow.append(con, priv, rez)
						
					var panel = $('<div/>', {class: 'qstatus-panel setting-panel'}).append(toprow, middlerow, bottomrow)
				var oqstatus_internet = $('<div/>', {class: 'qstatus-settings', title:'[layer] - [frame] - [connected]'}).append($('<div/>', {class: 'qstatus-piece qinfo'}), panel)
			oqstatus.append(oqstatus_brush, oqstatus_message, oqstatus_internet);
			
			var info = $('<div/>', {class: 'gui'})
				var cspinner = $('<div class="color-spinner overlay-piece"></div>');
					
					var selectorcode = '<div class="color-selector"></div>';
					var preview = $('<div class="preview-col"></div>')
						
					var hue = $('<div class="hue-pick"></div>').append(preview, selectorcode)
					
					var lp = $('<div class="light-pick"></div>').html(selectorcode),
						sp = $('<div class="saturation-pick"></div>').html(selectorcode),
						ap = $('<div class="alpha-pick"></div>').html(selectorcode)
							
					var pick = $('<div class="hsl-select-pick"></div>').append(ap, lp. sp, hue)
					
					var palette = $('<div class="palette-storage"></div>')
				cspinner.append(pick, palette)
				
				var chatbox = $('<div class="chat-box overlay-piece"></div>');
					var chatcontent = $('<div class="chat-content"></div>')
					
					
						var chati = $('<textarea/>', {tabindex: '-1', class: 'chat-input'})
						var ssize = $('<div/>', {class: 'ci-size'})
					var chatinput = $('<div/>', {class: 'chat-input-box'}).append(chati, ssize)
					
				chatbox.append(chatcontent, chatinput)
				
		
			var flalist = $('<div/>', {class: 'flayer-list-container overlay-piece'}),
				flacontainer = $('<div/>', {class: 'flayer-list'}),
				flainfo = $('<div/>', {class: 'flayer-info'})
			flalist.append(flainfo, flacontainer)
		
		
			info.append(cspinner, chatbox, flalist);
		
		
		
		overlay.append(info, oqstatus);
		
		
		var drawarea = $('<div class="draw-main-area"></div>').append(canvasworkarea, overlay)
		
		$('body').removeClass('room main').addClass('canvas').html('');
		$('body').append(canvasworkarea, overlay);
		
		document.location.hash = room
		
		
		
		if(onRoom){
			ROOM = new onRoom(room);
		}
	}
	
};

var getRoom = function(){
	return document.location.hash.substr(1)
}















