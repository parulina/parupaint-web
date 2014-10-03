var manifest = chrome.runtime.getManifest();
var url = 'http://draw.sqnya.se';

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


var initParupaint = function(room){
	document.title = 'Starting up...';
	
	clearInterval(updateRooms);
	
	if(!room){
		document.title = '-- parupaint home --';
		var title = $('<h1></h1>').text('parupaint');
		var header = $('<h2></h2>').text('for chrome (beta)');
		var container = $('<div class="show-area"></div>');
		var input = $('<div class="room-input"></div>').html('<input class="new-room-input" type="text"></input>');
		$('body').removeClass('room').addClass('main').html('');
		$('body').append(title).append(input).append(header).append($('<div class="room-counter"></div>')).append(container);
		
		$('input.new-room-input').keypress(function(e){
			if(e.keyCode == 13){
				initParupaint($(this).val());
			}
		});
		
		setTimeout(updateRooms, 1000);
	}
	
};