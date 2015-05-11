"use strict";

function hex2rgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);

    if(!result) {
        console.error('invalid color.', hex)
        return {
            r: 255,
            g: 255,
            b: 255,
            a: 255
        };
    }

    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: result[4] == undefined ? 255 : parseInt(result[4], 16)
    } : null;
};

var ParupaintCanvas = new function() {
    // this ONLY manipulates the canvas, nothing more.
    this.DrawLine = function(canvas, x1, y1, x2, y2, color, width) {
        if(canvas.length) {
            var ctx = canvas[0].getContext('2d');

            var composite = ctx.globalCompositeOperation;
            var col = hex2rgb(color);

            if(!col.a) {
                ctx.globalCompositeOperation = "destination-out";
                col.a = 255;
            }
            ctx.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (col.a / 255.0) + ')'

            ctx.lineWidth = width;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.globalCompositeOperation = composite;


        }
    };

    this.Focus = function(layer, frame) {
        if(!$('.canvas-pool canvas[data-layer=' + layer + '][data-frame=' + frame + ']').length) return false;


        // clear everything
        $('.canvas-pool').removeClass('blink-layer').children('canvas').
        removeClass('focused focused-frame position focused-left focused-right blink-layer');
        // focused-layer has is own logic because css anims

        if(!$('.canvas-pool canvas[data-layer=' + layer + ']').hasClass('focused-layer')) {
                // focused-layer has changed
            $('.canvas-pool canvas').removeClass('focused-layer').
            filter('[data-layer=' + layer + ']').addClass('focused-layer');

            $('.canvas-pool').
            removeClass('blink-layer').
            addClass('blink-layer');
            // make it blink ☆
        }


        var getFrameStartEnd = function(frame) {
                var start = $(frame),
                    end = $(frame);
                // find out the start
                while(start.hasClass('extended')) {
                    start = $('.canvas-pool canvas').
                    filter('[data-layer=' + start.data('layer') + ']').
                    filter('[data-frame=' + (start.data('frame') - 1) + ']');
                }
                // find out the end
                while((end.is('[data-extended]') || end.hasClass('extended'))) {
                    // reverse
                    end = $('.canvas-pool canvas').
                    filter('[data-layer=' + end.data('layer') + ']').
                    filter('[data-frame=' + (end.data('frame') + 1) + ']');
                }

                return [start, end];
            }
            // set both axis focuses
        $('.canvas-pool canvas').filter('[data-frame=' + frame + ']').
        each(function(k, e) {
            // loop each layer and set which frames are displayed
            var frame = $(e);
            var pos = getFrameStartEnd(frame);
            var start = pos[0],
                end = pos[1];

            // focus only the frame
            start.addClass('focused-frame');

            // only for the selected layer
            if(start.data('layer') == layer) {
                // then just mark it focused to catch drawing
                start.addClass('focused');
                // also mark previous and next frames
                var prev = $('.canvas-pool canvas[data-layer=' +
                    start.data('layer') + '][data-frame=' +
                    (start.data('frame') - 1) + ']');

                var next = $('.canvas-pool canvas[data-layer=' +
                    end.data('layer') + '][data-frame=' +
                    (end.data('frame') + 1) + ']');

                var pos_prev = getFrameStartEnd(prev),
                    pos_next = getFrameStartEnd(next);

                pos_prev[0].addClass('focused-left');
                pos_next[0].addClass('focused-right');


            }


        });


        // get the real frame pos and mark it
        var cframe = $('.canvas-pool canvas').
        filter('[data-layer=' + layer + '][data-frame=' + frame + ']').
        addClass('position');

        return true;
    }


    this.Advance = function(nlayer, nframe) {
        var canvas = $('canvas.position')
        if(canvas.length) {
            var layer = canvas.data('layer'),
                frame = canvas.data('frame'),
                maxlayers = $('canvas[data-frame=' + frame + ']').length,
                maxframes = $('canvas[data-layer=' + layer + ']').length
            if(typeof nlayer == "number") {
                var nl = (layer + nlayer >= maxlayers ? ((layer + nlayer) % maxlayers) : layer + nlayer)
                var cc = $('canvas[data-frame=' + frame + '][data-layer=' + nl + ']')
                if(cc.length) {
                    this.Focus(nl, frame)
                }
            }
            if(typeof nframe == "number") {
                var nf = (frame + nframe >= maxframes ?
                    ((frame + nframe) % maxframes) :
                    frame + nframe);
                var cc = $('canvas[data-frame=' + nf + '][data-layer=' + layer + ']')
                if(cc.length) {
                    this.Focus(layer, nf)
                }
            }
        }

    }

    this.Clear = function(color, layer, frame) {
        var cc = $('.canvas-pool canvas[data-layer=' + layer + '][data-frame=' + frame + ']')
        if(!cc.length) cc = $('canvas.focused');

        if(cc.length) {
            var w = cc[0].width,
                h = cc[0].height

            var ctx = cc.get(0).getContext('2d')

            // should probably make this better.
            if(color == "#00000000" || color == "transparent") {
                ctx.clearRect(0, 0, w, h)
            } else {
                ctx.fillStyle = color
                ctx.fillRect(0, 0, w, h)
            }
        }
    }
    this.AddFrame = function(layer, frame) {
        var cc = $('canvas.focused')
        if(cc.length) {
            var w = cc[0].width,
                h = cc[0].height;

            var l = layer != undefined ? layer : parseInt(cc.data('layer')),
                f = frame != undefined ? frame : parseInt(cc.data('frame')),
                tf = $('.canvas-pool canvas[data-layer=' + l + ']').length

            for(var i = tf - 1; i > f; i--) {
                var af = $('canvas[data-layer=' + l + '][data-frame=' + i + ']')
                if(af.length) {
                    af.data('frame', i + 1).attr('data-frame', i + 1).attr('id', 'flayer-' + l + '-' + (i + 1))
                }
            }
            var nf = f + 1,
                id = ('flayer-' + l + '-' + nf)
            var nc = $('<canvas width="' + w + '" height="' + h + '" id="' + id + '" data-layer="' + l + '" data-frame="' + nf + '"/>')
            nc.insertAfter($('.canvas-pool canvas[data-layer=' + l + '][data-frame=' + f + ']'))
        }
    }
    this.RemoveFrame = function(layer, frame) {
        var cc = $('canvas.focused');
        if(cc.length) {
            var w = cc[0].width,
                h = cc[0].height;

            var l = layer != undefined ? layer : parseInt(cc.data('layer')),
                f = frame != undefined ? frame : parseInt(cc.data('frame'))

            if($('.canvas-pool canvas[data-layer=' + l + ']').length <= 1) return false;

            $('.canvas-pool canvas[data-layer=' + l + '][data-frame=' + f + ']').remove()
            var tf = $('.canvas-pool canvas[data-layer=' + l + ']').length

            for(var i = f + 1; i <= tf; i++) {
                var af = $('canvas[data-layer=' + l + '][data-frame=' + i + ']')
                if(af.length) {
                    af.data('frame', i - 1).attr('data-frame', i - 1).attr('id', 'flayer-' + l + '-' + (i - 1))
                }
            }
        }

        updateFrameinfoSlow()
    }
    this.AddLayer = function(layer) {
        var cc = $('canvas.focused');
        if(cc.length) {
            var w = cc[0].width,
                h = cc[0].height;

            var l = layer != undefined ? layer : parseInt(cc.data('layer')),
                f = parseInt(cc.data('frame')),
                tl = $('.canvas-pool canvas[data-frame=0]').length;

            var nl = l + 1;

            for(var i = tl - 1; i > l; i--) {
                var af = $('canvas[data-layer=' + i + ']');
                if(af.length) {
                    af.data('layer', (i + 1)).attr('data-layer', (i + 1)).attr('id', 'flayer-' + ((i + 1)) + '-' + af.data('frame'));
                }
            }
            var id = ('flayer-' + nl + '-' + f);
            var nc = $('<canvas width="' + w + '" height="' + h + '" id="' + id + '" data-layer="' + nl + '" data-frame="' + f + '"/>');
            nc.insertAfter($('.canvas-pool canvas[data-layer=' + l + '][data-frame=' + f + ']'));
        }
    }
    this.RemoveLayer = function(layer) {
        var cc = $('canvas.focused')
        if(cc.length) {
            var w = cc[0].width,
                h = cc[0].height

            var l = layer != undefined ? layer : parseInt(cc.data('layer')),
                f = parseInt(cc.data('frame'))

            if($('.canvas-pool canvas[data-frame=0]').length <= 1) return false;

            $('.canvas-pool canvas[data-layer=' + l + ']').remove()
            var tl = $('.canvas-pool canvas[data-frame=0]').length

            for(var i = l + 1; i <= tl; i++) {
                $('canvas[data-layer=' + i + ']').each(function(k, e) {
                    $(e).data('layer', i - 1).attr('data-layer', i - 1).attr('id', 'flayer-' + (i - 1) + '-' + $(e).data('frame'))
                })
            }
        }

    }

    this.Init = function(width, height, cdata) {

        if(typeof width != "number" ||
            typeof height != "number") {

            var width = parseInt($('canvas').prop('width')),
                height = parseInt($('canvas').prop('height'));
            return [width, height];
        }
        // set some basics

        $('.canvas-workarea').width(width).height(height)
        $('.canvas-pool').data('ow', width).data('oh', height);

        if(typeof cdata != "undefined") {
            $('.canvas-pool').html('')
            for(var l = 0; l < cdata.length; l++) {

                for(var f = 0; f < cdata[l].length; f++) {
                    // add each frame
                    var ext = cdata[l][f].extended;
                    var dat = cdata[l][f].data;

                    if(ext) {
                        var ef = f;
                        while((ext && ef != 0)) {
                            ef--;
                        }
                        var t = (f - ef); // expension length

                        var nc = $('.canvas-pool canvas[data-layer=' + l + '][data-frame=' + ef + ']');
                        nc.attr('data-extended', t);

                    }
                    //console.log('Creating ' + l + " → " + f + " ("+ext+")")
                    var id = 'flayer-' + l + '-' + f;

                    var nc = $('<canvas width="' + width +
                        '" height="' + height +
                        '" id="' + id +
                        '" data-layer="' + l +
                        '" data-frame="' + f + '"/>');

                    var ctx = nc[0].getContext('2d');
                    ctx.webkitImageSmoothingEnabled = false;
                    ctx.mozimageSmoothingEnabled = false;
                    ctx.imageSmoothingEnabled = false;

                    if(typeof ext == "boolean" && ext) nc.addClass('extended');
                    if(typeof dat == "string"){
                        // wow there's data
                        var img = new Image;
                        img.src = dat;
                        ctx.drawImage(img, 0, 0);
                    }

                    $('.canvas-pool').append(nc);
                }
            }

        } else {
            $('.canvas-pool').children('canvas').each(function(k, e) {
                if(e) {
                    e.width = width;
                    e.height = height;
                }
            });
        }
    }
    this.Download = function() {
        if($('.canvas-pool canvas').length) {
            var w = $('.canvas-pool').data('ow'),
                h = $('.canvas-pool').data('oh')

            var canvas = $('<canvas width="' + w + '" height="' + h + '"/>')
            var iframes = $('.canvas-pool canvas[data-frame=0]'),
                ifn = iframes.length
            for(var i = 0; i < ifn; i++) {
                canvas[0].getContext('2d').drawImage(iframes.get(i), 0, 0)
            }
            var fname = 'Drawing_at_' + new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/\:/g, '.') + '.png'
                //link = $('<a/>', {href: iframes.get(0).toDataURL(), download: fname}).text('download canvas ['+fname+']')
                //console.log(link)
                //link.get(0).click()
            var a = document.createElement('a');
            document.body.appendChild(a);
            a.download = fname;
            a.href = iframes.get(0).toDataURL();
            a.click();
        }
    }
    return this;
};
