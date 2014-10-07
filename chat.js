
// chat-box
//   chat-entry
//     chat-message


var messageQueueTimer = null
var clearMessageQueue = function(delay){
	console.log('clearmessagequeue', delay)
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
			console.log('stop')
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
				//clearMessageQueue(3000)
			}
			overlayShow(false)
		}
		
		if(name){
			if(box.children('.chat-entry').length){
				var last = box.children('.chat-entry').last()
				if(last.data('name') == name){
					return last.append(m)
				}
			}
		}
		
		var entry = $('<div/>', attrs).append(m)
		
		return box.append(entry)
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
			
			addMessage(msg, name, time, notify == undefined ? true : notify)
			
		})
	}
}


var sendChatMessage = function(msg, room){
	if(!room) room = getRoom()
	var name = $('.canvas-cursor.cursor-self').data('name')
	var time = new Date().toTimeString().split(' ')[0]
	
	var addfunc = function(){
		addChatMessage(room, msg, name, time, false)
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
		console.log($('.chat-input-box .ci-size').html($(this).val()).html())
	})
}