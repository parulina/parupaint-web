
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
	var alpha = 255
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	
	if(!result) {
		console.log('invalid color.', hex)
	}
	
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: parseInt(result[4], 16) || alpha
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
	var hue = $('.hsl-select-pick .hue-pick').data('value') || 0,
		sat = $('.hsl-select-pick .saturation-pick').data('value') || 0.5,
		lit = $('.hsl-select-pick .light-pick').data('value') || 0.5,
		aph = $('.hsl-select-pick .alpha-pick').data('value') || 1
	
	var rgb = hsl2rgb(hue, sat, lit)
	rgb.a = aph*255
	return rgb;
	
}

var getColorSliderHex = function(){
	var rgb = getColorSliderRgb();
	rgb.a = 255;
	return rgb2hex(rgb)
}


var getColorSliderHexAlpha = function(){
	return rgb2hex(getColorSliderRgb())
}





var setPreviewColor = function(col){
	var hsll = $('.color-spinner .preview-col');
	if(hsll.length){
		hsll.css({ backgroundColor: col })
	}
}

var setColorSliderHex = function(hex){
	var rgb = hex2rgb(hex)
	setColorSliderRgb(rgb.r, rgb.g, rgb.b, rgb.a)

}
var setColorSliderRgb = function(r, g, b, a){
	if(typeof r == "object"){
		g = r.g, b = r.b, a = r.a,
		r = r.r
	}
	console.log('setColorSliderRgb', r, g, b, a)
	var hsl = rgb2hsl(r/255, g/255, b/255)
	setColorSliderHsl(hsl.h, hsl.s, hsl.l, a)

}
var setColorSliderHsl = function(h, s, l, a){
	//console.log('setColorSliderHsl', h, s, l, a)
	if(h){
		$('.hsl-select-pick .hue-pick').data('value', h/360).children('.color-selector').css('-webkit-transform', 'rotate('+h+'deg)')
		var rgb = hue2rgb(h)
		var rgbstr = 'rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')'
		$('.hsl-select-pick .light-pick').css({background: '-webkit-linear-gradient('+rgbstr+', black)'})
	}
	if(s){
		$('.hsl-select-pick .saturation-pick').data('value', s).children('.color-selector')//.css('-webkit-transform', 'rotate('+h+'deg)')
	}
	if(l){
		$('.hsl-select-pick .light-pick').data('value', l).children('.color-selector')//.css('-webkit-transform', 'rotate('+h+'deg)')
	}

}






colorScript = function(){
	
	
	$('.color-spinner .hue-pick').bind('mousemove mousedown', function(e){
		if(e.which == 1){
			var dx = (e.offsetX - ($(this).width()/2)),
				dy = (e.offsetY - ($(this).height()/2))
			
			var dist = Math.sqrt(dx*dx + dy*dy)
			var ang = Math.atan2(dy, dx)
			var deg = ((ang > 0 ? ang : (2*Math.PI + ang)) * 360 / (2*Math.PI))
			
			setColorSliderHsl(deg)
			
		}
	})
	
	$('.color-spinner .light-saturation-pick').bind('mousemove mousedown', function(e){
		if(e.which == 1){
			
			var saturation = (1.0-(e.offsetX / $(this).width()))*100,
				light = (1.0 - (e.offsetY / $(this).height()))*50 + 50*(1.0-saturation/100)
			
			console.log(saturation, (e.offsetY / $(this).height()), light)
			var hex = interfaceColor(null, saturation, light)
			cursorColor(null, hex)
		}
	})
}



