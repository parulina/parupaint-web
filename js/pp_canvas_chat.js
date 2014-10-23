
// chat-box
//   chat-entry
//     chat-message


var messageQueueTimer = null
var clearMessageQueue = function(delay){
	if(delay && !messageQueueTimer){
		messageQueueTimer = setInterval(clearMessageQueue, delay)
		console.log('init')
	} else {
		if($('.qstatus-message').children().length){
			$('.qstatus-message').children().first().remove()
			console.log('removed first')
		}else{
			clearInterval(messageQueueTimer)
			messageQueueTimer = null
		}
	}
}

var addMessage = function(msg, name, time, notify){
	if(msg){
		var box = $('.chat-content')
		var attrs = {class:'chat-entry'}
		if(name) attrs['data-name'] = name
		
		var m = $('<div />',{class:'chat-message', html: msg.replace(new RegExp('\r?\n','g'), '<br />')})
		if(time) m.attr('data-time', time)
			
		if(notify){
			$('.qstatus-message').append($('<div/>', attrs).html(m.clone()))
			if(!messageQueueTimer){
				clearMessageQueue(3000)
			}
		}
		
		if(name){
			if(box.children('.chat-entry').length){
				var last = box.children('.chat-entry').first()
				if(last.data('name') == name){
					return last.prepend(m)
				}
			}
		}
		
		
		
		var entry = $('<div/>', attrs).append(m)
		return box.prepend(entry)
		
	}
}

var addChatMessage = function(room, msg, name, time, notify){
	if(msg){
		if(!room) room = getRoom()
		chrome.storage.local.get('rooms', function(d){
			if(d.length){
				if(d == undefined) 		d = {};
				if(d[room] == undefined)	d[room] = {};
				if(d[room].chatbox == undefined)	d[room].chatbox = [];
				
				d[room].chatbox.push({name:name, msg:msg, time:time})
				chrome.storage.local.set({rooms: d}, failSafe);
			}
			console.log(msg, name, time, notify == undefined ? true : notify)
			addMessage(msg, name, time, notify == undefined ? true : notify)
			
		})
	}
}


var sendChatMessage = function(msg, room){
	if(!room) room = getRoom()
	var name = $('.canvas-cursor.cursor-self').data('name')
	
	
	if(room == getRoom()){
		if(navigator.onLine && isConnected()) //fixme: sockets
		{
			//todo
			roomConnection.socket.emit('chat', {msg: msg, name: name, time: Date.now()})
			
		} else {
			addChatMessage(room, msg, name, new Date().toTimeString().split(' ')[0], false)
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
		console.log($('.chat-input-box .ci-size').html($(this).val()).html())
	})
}