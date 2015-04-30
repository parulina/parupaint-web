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
		return {r: 255, g: 255, b: 255, a: 255};
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
        $('.canvas-pool canvas').removeClass('focused focused-frame focused-layer position focused-left focused-right');
        // set both axis focuses
        $('.canvas-pool canvas').filter('[data-frame=' + frame + ']').addClass('focused-frame');
        $('.canvas-pool canvas').filter('[data-layer=' + layer + ']').addClass('focused-layer');

        var cframe = $('.canvas-pool canvas[data-layer=' + layer + '][data-frame=' + frame + ']');
        cframe.addClass('position')
        if(cframe.hasClass('extended')) {
            // it's extended. roll it back
            while(cframe.hasClass('extended')) {
                cframe = $('.canvas-pool canvas[data-layer=' + layer + '][data-frame=' + (cframe.data('frame') - 1) + ']');
            }
        }
        cframe.addClass('focused');
        cframe.prev().addClass('focused-left');
        cframe.next().addClass('focused-right');



        $('.qstatus-piece.qinfo').attr('data-label', layer).attr('data-label-2', frame)
        $('.flayer-list .flayer-info-frame').removeClass('focused')
        $('.flayer-list .flayer-info-layer[data-layer=' + layer + '] .flayer-info-frame[data-frame=' + frame + ']').addClass('focused')

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
            return;
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
                    nc[0].getContext('2d').webkitImageSmoothingEnabled = false;
                    nc[0].getContext('2d').mozimageSmoothingEnabled = false;
                    nc[0].getContext('2d').imageSmoothingEnabled = false;
                    if(typeof ext == "boolean" && ext) nc.addClass('extended');

                    $('.canvas-pool').append(nc);
                }
            }
            //TODO focus

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
            a = document.createElement('a');
            document.body.appendChild(a);
            a.download = fname;
            a.href = iframes.get(0).toDataURL();
            a.click();
        }
    }
    return this;
};
