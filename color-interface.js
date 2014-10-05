
function rgb2hsl(r, g, b) {
	var
	min = Math.min(r, g, b),
	max = Math.max(r, g, b),
	diff = max - min,
	h = 0, s = 0, l = (min + max) / 2;
 
	if (diff != 0) {
		s = l < 0.5 ? diff / (max + min) : diff / (2 - max - min);
 
		h = (r == max ? (g - b) / diff : g == max ? 2 + (b - r) / diff : 4 + (r - g) / diff) * 60;
	}
 
	return {h:h, s:s, l:l};
}


function hsl2rgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {r: Math.round(r * 255), g: Math.round(g * 255), b:Math.round(b * 255)};
}

var hue2rgb = function(hue){
	var maxhue = 240, step = maxhue/4
	var rgb = {r: (hue+maxhue/2) % 360, g: (hue) % 360, b: (hue-maxhue/2) % 360 }
	for(var i in rgb){
		var col = rgb[i]
		if(col > 0 && col < maxhue){
			var r = col >= step ? ( col <= (maxhue - step) ? 1 : 1.0-(col - (maxhue - step))/60 ) : (col / step)
			rgb[i] = parseInt(255* r)
		} else {
			rgb[i] = 0
		}
		
	}
	return rgb
}

function hex2rgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	
	if(!result) {
		console.log('invalid color.', hex)
	}
	
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: result[4] == undefined ? 255 : parseInt(result[4], 16)
    } : null;
}

function rgb2hex(red, green, blue, alpha) {
	if(typeof red == "object"){
		green = red.g, blue = red.b, alpha = red.a, red = red.r
	}
	if(alpha == undefined) alpha = 255;
	
	return '#' + 
		('0' + red.toString(16)).slice(-2) +
		('0' + green.toString(16)).slice(-2) +
		('0' + blue.toString(16)).slice(-2) +
		(alpha != 255 ? ('0' + alpha.toString(16)).slice(-2) : '');
}




// remember: put hsl with 0-1 instead of 0-100

var getColorSliderRgb = function(){
	var hsl = getColorSliderHsl(),
		aph = $('.hsl-select-pick .alpha-pick').data('value') || 1
	var rgb = hsl2rgb(hsl.h, hsl.s, hsl.l)
	rgb.a = parseInt(aph*255)
	return rgb;
	
}
var getColorSliderHsl = function(){
	var hue = $('.hsl-select-pick .hue-pick').data('value') || 0,
		sat = $('.hsl-select-pick .saturation-pick').data('value') || 0.5,
		lit = $('.hsl-select-pick .light-pick').data('value') || 0.5
	
	return {h: hue, s:sat, l:lit}
	
}

var getColorSliderHex = function(){
	var rgb = getColorSliderRgb();
	rgb.a = 255;
	return rgb2hex(rgb)
}


var getColorSliderHexAlpha = function(){
	return rgb2hex(getColorSliderRgb())
}



var updateInterfaceHex = function(hex){
	setColorSliderHex(hex)
	setPreviewColor(hex)
}


var setPreviewColor = function(col){
	if(!col) col = getColorSliderRgb()
	if(col[0] == '#') col = hex2rgb(col)
	//console.log('setPreviewColor:',col)
	
	var hsll = $('.color-spinner .preview-col');
	if(hsll.length){
		
		hsll.css('background-color', 'rgba('+col.r+', '+col.g+', '+col.b+', '+col.a/255+')')
	}
	return col;
}

var setColorSliderHex = function(hex){
	var rgb = hex2rgb(hex)
	console.log('setColorSliderHex:', rgb)
	setColorSliderRgb(rgb.r, rgb.g, rgb.b, rgb.a)

}
var setColorSliderRgb = function(r, g, b, a){
	if(typeof r == "object"){
		g = r.g, b = r.b, a = r.a,
		r = r.r
	}
	var hsl = rgb2hsl(r/255, g/255, b/255)
	//console.log('setColorSliderRgb', r, g, b, a, hsl)
	setColorSliderHsl(hsl.h, hsl.s, hsl.l, a/255)

}


var setColorSliderHsl = function(h, s, l, a){
	//console.log('setColorSliderHsl', h, s, l, a)
	if(h != undefined){
		$('.hsl-select-pick .hue-pick').data('value', h/360).children('.color-selector').css('-webkit-transform', 'rotate('+h+'deg)')
		var rgb = hue2rgb(h)
		var rgbstr = 'rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')'
		$('.hsl-select-pick .light-pick').css({background: '-webkit-linear-gradient(white 0%, '+rgbstr+' 50%, black 100%)'})
	}
	if(s != undefined){
		$('.hsl-select-pick .saturation-pick').data('value', s).children('.color-selector').css('top', (l*100)+'%')
	}
	if(l != undefined){
		$('.hsl-select-pick .light-pick').data('value', l).children('.color-selector').css('top', ((1.0-l)*100)+'%')
	}
	if(a != undefined){
		$('.hsl-select-pick .alpha-pick').data('value', a).css('background-color', 'rgba(255,255,255,'+a+')').children('.color-selector').css('top', ((1.0-a)*100)+'%')
	}

}






colorScript = function(onchange){
	var oldcol = null;
	$('.hsl-select-pick > div').bind('mousedown', function(e){
		oldcol = getColorSliderHexAlpha()
	}).bind('mouseup', function(e){
		if(getColorSliderHexAlpha() != oldcol){
			onchange(oldcol, getColorSliderHexAlpha())
		}
	})
	
	$('.color-spinner .hue-pick').bind('mousemove mousedown', function(e){
		if(e.which == 1 && e.target == this){
			var dx = (e.offsetX - ($(this).width()/2)),
				dy = (e.offsetY - ($(this).height()/2))
			
			var dist = Math.sqrt(dx*dx + dy*dy)
			var ang = Math.atan2(dy, dx)
			var deg = ((ang > 0 ? ang : (2*Math.PI + ang)) * 360 / (2*Math.PI))
			setColorSliderHsl(deg)
			var rgb = setPreviewColor()
			
			
		}
	})
	
	$('.color-spinner .light-pick').bind('mousemove mousedown', function(e){
		if(e.which == 1){
			
			var light = (1.0-(e.offsetY / $(this).height()))
			setColorSliderHsl(null, null, light)
			var rgb = setPreviewColor()
		}
	})
	$('.color-spinner .alpha-pick').bind('mousemove mousedown', function(e){
		if(e.which == 1){
			
			var alpha = (1.0-(e.offsetY / $(this).height()))
			setColorSliderHsl(null, null, null, alpha)
			var rgb = setPreviewColor()
			console.log(rgb.a, rgb2hex(rgb))
		}
	})
}



