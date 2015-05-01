"use strict";


var ParupaintColorpicker = new function(){
    /*
    colorScript(function(oldc, newc){
		addPaletteEntryRgb(newc)
		Brush.color(rgb2hex(newc)).update()
	})
    */
    return this;
}

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
    if(typeof r == "string"){
        if(r[0] == '#'){
            this.FromHex(r);
        }
    }

    return this;
}
