
// chat-box
//   chat-entry
//     chat-message

var addMessage = function(msg, name, time, notify){
	if(msg){
		var box = $('.chat-content')
		
		var m = $('<div class="chat-message"></div>').html(msg.replace(new RegExp('\r?\n','g'), '<br />'))
		if(time) m.attr('data-time', time)
		
		if(notify){
			$('.qstatus-message').html(m).show()
		}
		if(name){
			if(box.children('.chat-entry').length){
				var last = box.children('.chat-entry').last()
				if(last.data('name') == name){
					return last.append(m)
				}
			}
		}
		var attrs = {class:'chat-entry'}
		if(name) attrs['data-name'] = name
		
		var entry = $('<div/>', attrs).append(m)
		
		return box.append(entry)
	}
}

var addChatMessage = function(room, msg, name, time){
	if(msg){
		
		chrome.storage.local.get('rooms', function(d){
			if(d.length){
				if(d == undefined) 		d = {};
				if(d[room] == undefined)	d[room] = {};
				if(d[room].chatbox == undefined)	d[room].chatbox = [];
				
				d[room].chatbox.push({name:name, msg:msg, time:time})
				chrome.storage.local.set({rooms: d}, failSafe);
			}
			
			addMessage(msg, name, time, true)
			
		})
	}
}


var sendChatMessage = function(msg, room){
	if(room == undefined) room = getRoom()
	var name = $('.canvas-cursor.cursor-self').data('name')
	var time = new Date().toTimeString().split(' ')[0]
	
	var addfunc = function(){
		addChatMessage(room, msg, name, time)
	}
	
	if(room == getRoom()){
		if(navigator.onLine && false) //fixme: sockets
		{
			//todo
		} else {
			addfunc()
		}
	}
}

chatScript = function(room){
	
	$('textarea.chat-input').keydown(function(e){
		console.log(e.keyCode)
		if(e.keyCode == 13 && !e.shiftKey){
			sendChatMessage($(this).val())
			$(this).val('')
			return false;
		} else if(e.keyCode == 27){
			overlayGone(true)
		}
		$('.chat-input-box .ci-size').html($(this).val())
	})
}