
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

var addCanvasFrame = function(layer, frame){
	var cc = $('canvas.focused')
	if(cc.length){
		var w = cc[0].width,
			h = cc[0].height

		var l = layer != undefined ? layer : parseInt(cc.data('layer')),
			f = frame != undefined ? frame : parseInt(cc.data('frame')),
			tf = $('.canvas-pool canvas[data-layer='+l+']').length

		for(var i = tf-1; i > f; i--){
			console.log('frame ' + i + ' is ahead. advancing it')
			var af = $('canvas[data-layer='+l+'][data-frame='+i+']')
			if(af.length){
				af.data('frame', i+1).attr('data-frame', i+1).attr('id', 'flayer-' + l + '-' + (i+1))
			}
		}
		var nf = f+1,
			id = ('flayer-' + l + '-' + nf)
		var nc = $('<canvas width="'+w+'" height="'+h+'" id="'+id+'" data-layer="'+l+'" data-frame="'+nf+'"/>')
		nc.insertAfter($('.canvas-pool canvas[data-layer='+l+'][data-frame='+f+']'))
	}

	updateFrameinfoSlow()
}
var removeCanvasFrame = function(layer, frame){
	var cc = $('canvas.focused')
	if(cc.length){
		var w = cc[0].width,
			h = cc[0].height

		var l = layer != undefined ? layer : parseInt(cc.data('layer')),
			f = frame != undefined ? frame : parseInt(cc.data('frame'))

		if($('.canvas-pool canvas[data-layer='+l+']').length <= 1) return false;

		$('.canvas-pool canvas[data-layer='+l+'][data-frame='+f+']').remove()
		var tf = $('.canvas-pool canvas[data-layer='+l+']').length

		for(var i = f+1; i <= tf; i++){
			console.log('frame ' + i + ' is ahead. backwarding it')
			var af = $('canvas[data-layer='+l+'][data-frame='+i+']')
			if(af.length){
				af.data('frame', i-1).attr('data-frame', i-1).attr('id', 'flayer-' + l + '-' + (i-1))
			}
		}
	}

	updateFrameinfoSlow()
}
var addCanvasLayer = function(layer){
	var cc = $('canvas.focused')
	if(cc.length){
		var w = cc[0].width,
			h = cc[0].height

		var l = layer != undefined ? layer : parseInt(cc.data('layer')),
			f = parseInt(cc.data('frame')),
			tl = $('.canvas-pool canvas[data-frame=0]').length

		var nl = l+1

		for(var i = tl-1; i > l; i--){
			console.log('layer ' + i + ' is ahead. advancing it')
			var af = $('canvas[data-layer='+i+']')
			if(af.length){
				af.data('layer', (i+1)).attr('data-layer', (i+1)).attr('id', 'flayer-' + ((i+1)) + '-' + af.data('frame'))
			}
		}
		var id = ('flayer-' + nl + '-' + f)
		var nc = $('<canvas width="'+w+'" height="'+h+'" id="'+id+'" data-layer="'+nl+'" data-frame="'+f+'"/>')
		nc.insertAfter($('.canvas-pool canvas[data-layer='+l+'][data-frame='+f+']'))
	}

	updateFrameinfoSlow()
}
var removeCanvasLayer = function(layer){
	var cc = $('canvas.focused')
	if(cc.length){
		var w = cc[0].width,
			h = cc[0].height

		var l = layer != undefined ? layer : parseInt(cc.data('layer')),
			f = parseInt(cc.data('frame'))

		if($('.canvas-pool canvas[data-frame=0]').length <= 1) return false;

		$('.canvas-pool canvas[data-layer='+l+']').remove()
		var tl = $('.canvas-pool canvas[data-frame=0]').length

		for(var i = l+1; i <= tl; i++){
			console.log('layer ' + i + ' is ahead. backwarding it')
			$('canvas[data-layer='+i+']').each(function(k, e){
				$(e).data('layer', i-1).attr('data-layer', i-1).attr('id', 'flayer-' + (i-1) + '-' + $(e).data('frame'))
			})
		}
	}

	updateFrameinfoSlow()
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

				var nc = $('<canvas width="'+width+'" height="'+height+'" id="'+id+'" data-layer="'+l+'" data-frame="'+f+'"/>')
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
