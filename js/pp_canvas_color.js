
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

function rgba2css(r, g, b, a){
	if(typeof r == "object"){
		g = r.g, b = r.b, a = r.a, r = r.r
	}
	if(a == undefined) a = 1
	return 'rgba('+r+','+g+','+b+','+a+')'
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
		return {r: 255, g: 255, b: 255, a: 255};
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
	var hue = $('.hsl-select-pick .hue-pick').data('value'),
		sat = $('.hsl-select-pick .saturation-pick').data('value'),
		lit = $('.hsl-select-pick .light-pick').data('value'),
		aph = $('.hsl-select-pick .alpha-pick').data('value')
	
	
	return {h: isNaN(hue) ? 0 : hue, s: isNaN(sat) ? 0.5 : sat, l: isNaN(lit) ? 0.5 : lit, a: isNaN(aph) ? 1 : aph}
	
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
	//console.log('setColorSliderHex:', rgb)
	setColorSliderRgb(rgb.r, rgb.g, rgb.b, rgb.a)

}
var setColorSliderRgb = function(r, g, b, a){
	if(typeof r == "object"){
		g = r.g, b = r.b, a = r.a,
		r = r.r
	}
	var hsl = rgb2hsl(r/255, g/255, b/255)
	//console.log('setColorSliderRgb', r, g, b, a, hsl)
	setColorSliderHsl(parseInt(hsl.h)/360, hsl.s, hsl.l, a/255)

}


var setColorSliderHsl = function(h, s, l, a){
	//console.log('setColorSliderHsl', h, s, l, a)
	if(h != undefined || h != null){
		$('.hsl-select-pick .hue-pick').data('value', h).children('.color-selector').css('transform', 'rotate('+h*360+'deg)')
		var rgb = hue2rgb(h*360)
		var rgbstr = 'rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')'
		$('.hsl-select-pick .light-pick').css({
			background: 'linear-gradient(white 0%, '+rgbstr+' 50%, black 100%)'
		})
		$('.hsl-select-pick .saturation-pick').css({
			background: 'linear-gradient(90deg, hsl('+h*360+', 0%, 50%), hsl('+h*360+', 100%, 50%))'
		})
	}
	if(s != undefined || s != null){
	    	var hue = $('.hsl-select-pick .hue-pick').data('value'),
		    light = 0.5; //$('.hsl-select-pick .light-pick').data('value');

		var rgb = hsl2rgb(hue, s, light),
		    rgbstr = 'rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')';

		$('.hsl-select-pick .light-pick').css({
			background: 'linear-gradient(white 0%, '+rgbstr+' 50%, black 100%)'
		})
		$('.hsl-select-pick .saturation-pick').data('value', s).children('.color-selector').css('left', (s*100)+'%')
	}
	if(l != undefined || l != null){
		$('.hsl-select-pick .light-pick').data('value', l).children('.color-selector').css('top', ((1.0-l)*100)+'%')
	}
	if(a != undefined || a != null){
		$('.hsl-select-pick .alpha-pick').data('value', a).css('background-color', 'rgba(255,255,255,'+a+')').children('.color-selector').css('top', ((1.0-a)*100)+'%')
	}

}



var addPaletteEntryRgb = function(r, g, b, a){
	if(typeof r == "object"){
		g = r.g, b = r.b, a = r.a,
		r = r.r
	}
	var storage = $('.palette-storage')
	if(storage.length){
		while(storage.children().length >= 16) {
			storage.children().last().remove()
		}
		var pal = $('<div/>', {class: "palette-entry"}).
			data('value', rgb2hex(r, g, b, a)).
			css('background-color', 'rgba('+r+', '+g+', '+b+', '+a/255+')');
		console.log(pal);

		storage.prepend(pal);
	}
}




colorScript = function(onchange){
	var oldcol = null,
    	    sel = null;

	var gui = $('.color-spinner.overlay-piece'),
	    pick = $('.hsl-select-pick'),
	    hsel = pick.children('.hue-pick'),
	    ssel = pick.children('.saturation-pick'),
	    lsel = pick.children('.light-pick'),
	    asel = pick.children('.alpha-pick');

	gui.unbind().on('mousedown', function(e){
	    var t = e.target || e.srcElement || e.originalTarget,
	   	tt = $(t);
	    if(!sel) {
		if(tt.is(hsel) || tt.is(ssel) || tt.is(lsel) || tt.is(asel)) {
			oldcol = getColorSliderHexAlpha();
			sel = $(t);
			$(this).on('mousemove');
		} else if(tt.is('.palette-entry')){
		    var hex = tt.data('value'),
			rgb = hex2rgb(hex),
		    	hsl = rgb2hsl(rgb.r/255, rgb.g/255, rgb.b/255, rgb.a/255);
		    console.log("Set saved palette color: " + hex);
		    setColorSliderHsl(hsl.h, hsl.s, hsl.l, hsl.a);
		    setPreviewColor();

		}

	    }
	}).on('mousemove', function(e){
		if(sel) {
		    var b = e.buttons == undefined ? e.which : e.buttons; // firefox
		    if(sel.is(hsel)) {
			//
			var y  = (e.pageY - sel.offset().top);
			var x  = (e.pageX - sel.offset().left);
			
			var dx = (x - (sel.width()/2)),
				dy = (y - (sel.height()/2))
			
			var dist = Math.sqrt(dx*dx + dy*dy)
			var ang = Math.atan2(dy, dx)
			var deg = ((ang > 0 ? ang : (2*Math.PI + ang)) * 360 / (2*Math.PI))
			setColorSliderHsl(deg/360)
			var rgb = setPreviewColor()

		    } else if(sel.is(asel) || sel.is(ssel) || sel.is(lsel)) {
			var sa = null, li = null, al = null;
			if(sel.is(asel) || sel.is(lsel)){
			    var y  = (e.offsetY || e.pageY - sel.offset().top);
			    var val = (1.0-(y / sel.height()));
			    if(val < 0.0) val = 0.0;
			    if(val > 1.0) val = 1.0;


			    if(sel.is(asel)){
				al = val;
			    } else if(sel.is(lsel)) {
				li = val;
			    }
			} else if(sel.is(ssel)) {
			    var x  = (e.offsetX || e.pageX - sel.offset().left);
			    var val = (x / sel.width());
			    if(val < 0.0) val = 0.0;
			    if(val > 1.0) val = 1.0;

			    sa = val;
			}

			setColorSliderHsl(null, sa, li, al)
			var rgb = setPreviewColor();
		    }
		}
	}).bind('mousewheel DOMMouseScroll', function(e){
	    var wd = e.originalEvent.wheelDelta/100,
	    	ed = e.originalEvent.detail * -1;
	    var w = wd || ed,
	    	s = $(e.target);
	    if(w && s.length) {

		var hsl = getColorSliderHsl(),
		    sliderstep = (w/50);
		    if(s.is(lsel)){
			    hsl.l += sliderstep;
			    if(hsl.l < 0) hsl.l = 0;
			    if(hsl.l > 1) hsl.l = 1;
		    } else if(s.is(asel)){
			    hsl.a += sliderstep;
			    if(hsl.a < 0) hsl.a = 0;
			    if(hsl.a > 1) hsl.a = 1;
		    } else if(s.is(hsel)){
			    hsl.h += sliderstep;
			    if(hsl.h < 0) hsl.h += 1;
			    if(hsl.h > 1) hsl.h -= 1;
		    } else if(s.is(ssel)){
			    hsl.s -= sliderstep;
			    if(hsl.s < 0) hsl.s = 0;
			    if(hsl.s > 1) hsl.s = 1;
		    }
			
		    //updateInterfaceHsl(hsl);
		    var rgb = setPreviewColor();
	
		    s.unbind('mouseout').bind('mouseout', function(e){
			    onchange(oldcol, getColorSliderRgb())
			    $(this).unbind('mouseout')
		    })
	    }
	}).on('mouseup', function(e){
	    if(sel){
		    sel = null;
		    onchange(oldcol, getColorSliderRgb())

	    }
	});
};
