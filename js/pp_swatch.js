"use strict";

var ParupaintSwatch = function() {




    // all these values: 0.0 - 1.0
    this.Hue = function(v) {
        var hue = $('.hsl-select-pick .hue-pick');
        if(typeof v != "number") return hue.data('value');

        hue.data('value', v);
        hue.children('.color-selector').
        css('transform', 'rotate(' + (v * 360) + 'deg)');

        return this;
    }

    this.Sat = function(v) {
        var sat = $('.hsl-select-pick .saturation-pick');
        if(typeof v != "number") return sat.data('value');

        sat.data('value', v)
        sat.children('.color-selector').css('left', (v * 100) + '%');
        return this;
    }

    this.Lit = function(v) {
        var lit = $('.hsl-select-pick .light-pick');
        if(typeof v != "number") return lit.data('value');

        lit.data('value', v);
        lit.children('.color-selector').css('top', ((1.0 - v) * 100) + '%');
        return this;
    }

    this.Alp = function(v) {
        var alp = $('.hsl-select-pick .alpha-pick');
        if(typeof v != "number") return alp.data('value');

        alp.data('value', v);
        alp.children('.color-selector').css('top', ((1.0 - v) * 100) + '%');
        alp.css('background-color', 'rgba(255,255,255,' + v + ')');
        return this;
    }

    this.OnColor = function(col){

    }

    this.Hsl = function(h, s, l, a) {
        //console.log(h,s,l,a)
        // old values
        var h2 = this.Hue(),
            s2 = this.Sat(),
            l2 = this.Lit(),
            a2 = this.Alp();

        // always will have something
        var h3 = h2 || h,
            s3 = s2 || s,
            l3 = l2 || l,
            a3 = a2 || a;

        var csstr = 'hsla(' + (h3 * 360) + ', ' +
            parseInt(s3 * 100) + '%, ' + parseInt(l3 * 100) + '%, ' + a3 + ')';

        if(!arguments.length) {
            return csstr;
        }

        if(typeof h == "number" && (h <= 1.0 && h >= 0.0)) {
            this.Hue(h);
            h3 = h;

            var csstr2 = 'hsla(' + (h * 360) + ', ' +
                parseInt(s3 * 100) + '%, 50%, 1)';

            $('.hsl-select-pick .light-pick').css({
                background: 'linear-gradient(white 0%, ' + csstr2 + ' 50%, black 100%)'
            })
            $('.hsl-select-pick .saturation-pick').css({
                background: 'linear-gradient(90deg, hsl(' + (h * 360) + ', 0%, 50%), hsl(' + (h * 360) + ', 100%, 50%))'
            })
        }

        if(typeof s == "number" && (s <= 1.0 && s >= 0.0)) {
            this.Sat(s);
            s3 = s;

            var l2 = 0.5;

            var csstr2 = 'hsla(' + (h3 * 360) + ', ' +
                parseInt(s * 100) + '%, 50%, 1)';

            $('.hsl-select-pick .light-pick').css({
                background: 'linear-gradient(white 0%, ' + csstr2 + ' 50%, black 100%)'
            })
        }
        if(typeof l == "number" && (l <= 1.0 && l >= 0.0)) {
            l3 = l;
            this.Lit(l);
        }

        if(typeof a == "number" && (a <= 1.0 && a >= 0.0)) {
            a3 = a;
            this.Alp(a);
        }
        $('.color-spinner .preview-col').css({

            'background-color': 'hsla(' + (h3 * 360) + ', ' +
                parseInt(s3*100) + '%, ' + parseInt(l3*100) + '%, ' + a3 + ')'
        })
        return this;
    }
    this.Hsl(0, 0.5, 0.5, 1);

    this.AddPaletteHsl = function(h, s, l, a) {
        if(typeof a != "number") a = 1.0;

        var storage = $('.palette-storage')
        if(storage.length) {
            while(storage.children().length >= 16) {
                storage.children().last().remove()
            }
            // TODO

            /*
    		var pal = $('<div/>', {class: "palette-entry"}).
    			data('value', rgb2hex(r, g, b, a)).
    			css('background-color', 'rgba('+r+', '+g+', '+b+', '+a/255+')');
                */
            storage.prepend(pal);
        }
    }


    var sel = null,
        sel_color = null,
        pthis = this;

    var gui = $(window),
        pick = $('.hsl-select-pick'),
        hsel = pick.children('.hue-pick'),
        ssel = pick.children('.saturation-pick'),
        lsel = pick.children('.light-pick'),
        asel = pick.children('.alpha-pick');

    gui.unbind('mousedown mousewheel mousemove mouseup DOMMouseScroll').
	on('mousedown', function(e) {

        var t = e.target || e.srcElement || e.originalTarget,
            tt = $(t);
        if(!sel) {
            if(tt.is(hsel) || tt.is(ssel) || tt.is(lsel) || tt.is(asel)) {
                sel_color = pthis.Hsl();
                sel = $(t);
                $(this).on('mousemove');

            } else if(tt.is('.palette-entry')) {

            }

        }
    }).on('mousemove', function(e) {
        if(sel) {
            var b = e.buttons == undefined ? e.which : e.buttons; // firefox
            if(sel.is(hsel)) {
                //
                var y = (e.pageY - sel.offset().top);
                var x = (e.pageX - sel.offset().left);

                var dx = (x - (sel.width() / 2)),
                    dy = (y - (sel.height() / 2));

                var dist = Math.sqrt(dx * dx + dy * dy);
                var ang = Math.atan2(dy, dx);
                var deg = ((ang > 0 ? ang : (2 * Math.PI + ang)) * 360 / (2 * Math.PI));
                pthis.Hsl(deg / 360);

            } else if(sel.is(asel) || sel.is(ssel) || sel.is(lsel)) {
                var sa = null,
                    li = null,
                    al = null;
                if(sel.is(asel) || sel.is(lsel)) {
                    var y = (e.offsetY || e.pageY - sel.offset().top);
                    var val = (1.0 - (y / sel.height()));
                    if(val < 0.0) val = 0.0;
                    if(val > 1.0) val = 1.0;


                    if(sel.is(asel)) {
                        al = val;
                    } else if(sel.is(lsel)) {
                        li = val;
                    }
                } else if(sel.is(ssel)) {
                    var x = (e.offsetX || e.pageX - sel.offset().left);
                    var val = (x / sel.width());
                    if(val < 0.0) val = 0.0;
                    if(val > 1.0) val = 1.0;

                    sa = val;
                }
                pthis.Hsl(null, sa, li, al);
            }
        }
    }).bind('mousewheel DOMMouseScroll', function(e) {
        var wd = e.originalEvent.wheelDelta / 100,
            ed = e.originalEvent.detail * -1;
        var w = wd || ed,
            s = $(e.target);
        if(w && s.length) {

            var sliderstep = (w / 50),
                temp_value;

            if(s.is(lsel)) {
                temp_value = pthis.Lit() + sliderstep;

            } else if(s.is(asel)) {
                temp_value = pthis.Alp() + sliderstep;

            } else if(s.is(hsel)) {
                temp_value = pthis.Hue() + sliderstep;

            } else if(s.is(ssel)) {
                temp_value = pthis.Sat() - sliderstep;
            }
            if(temp_value < 0) temp_value = 0;
            if(temp_value > 1) temp_value = 1;

            if(s.is(lsel)) {
                pthis.Hsl(null, null, temp_value);

            } else if(s.is(asel)) {
                pthis.Hsl(null, null, null, temp_value);

            } else if(s.is(hsel)) {
                pthis.Hsl(temp_value);

            } else if(s.is(ssel)) {
                pthis.Hsl(null, temp_value);
            }

            s.unbind('mouseout').bind('mouseout', function(e) {
                // add to palette

                var rgba = hsl2rgb(pthis.Hue(), pthis.Sat(), pthis.Lit());
                rgba.a = pthis.Alp() * 255;
                pthis.OnColor(rgba);

                $(this).unbind('mouseout');
            })
        }
    }).on('mouseup', function(e) {
        if(sel) {
            // add to palette
            var rgba = hsl2rgb(pthis.Hue(), pthis.Sat(), pthis.Lit());
            rgba.a = pthis.Alp() * 255;

            pthis.OnColor(rgba);
            sel = null;
        }
    });

}
