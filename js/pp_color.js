"use strict";

var ParupaintColor = function(r, g, b, a){
    this.r = 255;
    this.g = 255;
    this.b = 255;
    this.a = 255;

    if(typeof r == "number") this.r = r;
    if(typeof g == "number") this.g = g;
    if(typeof b == "number") this.b = b;
    if(typeof a == "number") this.a = a;


    this.FromHex = function(hex){
        hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
        // turn AAA to AA AA AA

        var result =
            /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        if(result){
            if(typeof result[4] == "undefined") result[4] = "FF";
            this.r = parseInt(result[1], 16);
            this.g = parseInt(result[2], 16);
            this.b = parseInt(result[3], 16);
            this.a = parseInt(result[4], 16);
        }
        return this;
    }
    this.ToCssString = function(){
        return "rgba("+ this.r
                        +", "+ this.g
                        +", "+ this.b
                        +", "+ parseFloat(this.a/255) +")";
    }
    this.ToHex = function(){
    	return '#' +
    		('0' + (this.r).toString(16)).slice(-2) +
    		('0' + (this.g).toString(16)).slice(-2) +
    		('0' + (this.b).toString(16)).slice(-2) +
    		('0' + (this.a).toString(16)).slice(-2);
    }
    this.ToHsl = function(){
        return rgb2hsl(this.r/255, this.g/255, this.b/255, this.a/255);

    }

    if(typeof r == "string"){
        if(r[0] == '#'){
            this.FromHex(r);
        }
    }

    return this;
}


function hsl2rgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function(p, q, t){
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

function rgb2hsl(r, g, b, a){
	var min = Math.min(r, g, b),
    	max = Math.max(r, g, b),
    	diff = max - min,
    	h = 0, s = 0, l = (min + max) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

	return {h:h, s:s, l:l, a: a};
}
