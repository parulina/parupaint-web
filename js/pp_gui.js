"use strict";
// control the ui...

function ParupaintInterface() {

    this.guiTimeout = null;
    this.guiTime = 3000;

    this.tabDown = false;

    this.zoom = 1.0;

    this.movingCanvas = false;
    this.zoomingCanvas = false;
    this.zoomingBrush = false;

    this.zoomStart = null;
    this.sizeStart = 0.0;

    this.key_move = 2;

    var pthis = this;

    $(window).scroll(function() {
        return !$('.qstatus-brush, .qstatus-settings').hasClass('panel-open');
    })

    this.OverlayVisible = function(b) {
        if(typeof b == "boolean") $('.gui').toggleClass('visible', b);
        return $('.gui').hasClass('visible');
    };
    this.HideOverlay = function() {
        if(this.OverlayVisible()) {
            this.OverlayVisible(false);
        }
        clearTimeout(this.guiTimeout);
    };
    this.ShowOverlay = function(permanent) {
        this.OverlayVisible(true);

        clearTimeout(this.guiTimeout);
        if(!permanent) {
            this.guiTimeout = setTimeout(function() {
                pthis.HideOverlay();
            }, this.guiTime);
        }
        $('#mouse-pool').focus();
    };
    this.ToggleOverlay = function(permanent) {
        if(this.OverlayVisible()) {
            this.HideOverlay();
        } else {
            this.ShowOverlay(permanent);
        }
    };
    $('html').on('keydown', function(e) {
        if($('input:focus, textarea:focus').length) return true;
        switch(e.keyCode) {
            case 27: // esc
                {
                    pthis.HideOverlay();
                    return;
                }
            case 84: // t
                {
                    $('body').toggleClass('canvas-preview');
                    return;
                }
            case 13:
            {
                if($('textarea:focus').length) return true;
                $('textarea.chat-input').focus();
                return false;
            }
            case 9: // tab
                {
                    if($('input:focus').length) return true;

                    if(pthis.OverlayVisible()) {
                        if(e.shiftKey) pthis.HideOverlay();
                        else {
                            pthis.ShowOverlay(true)
                        }
                    } else {
                        pthis.UpdateFrameinfoPosition();
                        pthis.ShowOverlay(false);
                    }
                    pthis.tabDown = true;
                    return false;
                }
            case 32: // space
                {
                    if(e.ctrlKey) {
                        pthis.zoomingCanvas = true;
                    } else if(e.shiftKey) {
                        pthis.zoomingBrush = true;
                    } else {
                        pthis.movingCanvas = true;
                    }
                    return false;
                }

            case 65: // a
            case 83: // s
                {
                    // next
                    var sd = (e.keyCode == 83);

                    if(pthis.tabDown) {
                        var l = $('canvas.focused').data('layer'),
                            f = $('canvas.focused').data('frame');
                        if(!PP.IsConnected()) {
                            if(sd) {
                                ParupaintCanvas.AddFrame();
                                return ParupaintCanvas.Focus(l, f + 1);
                            } else {
                                ParupaintCanvas.RemoveFrame();
                                if(!ParupaintCanvas.Focus(l, f)) {
                                    ParupaintCanvas.Focus(l, f - 1);
                                }
                            }
                        } else {
			    if(PP.readonly) return;
                            var fc = (sd ? 1 : -1);
                            PP.Emit('lf', {
                                l: l,
                                f: f,
                                fc: fc
                            });
                        }

                    } else {
                        ParupaintCanvas.Advance(null, sd ? 1 : -1);
                    }
                    pthis.UpdateFrameinfoPosition();

                    var dd = [
                        $('canvas.focused').data('layer'),
                        $('canvas.focused').data('frame')
                    ]
                    PP.Emit('lf', {
                        l: dd[0],
                        f: dd[1]
                    });
                    return true;
                }

            case 68: // d
            case 70: // f
                {
                    var fd = (e.keyCode == 70);
                    if(pthis.tabDown) {
                        var l = $('canvas.focused').data('layer'),
                            f = $('canvas.focused').data('frame'),
                            f1 = $('.canvas-pool canvas[data-layer=' + (l) + ']').length - 1,
                            f2 = $('.canvas-pool canvas[data-layer=' + (l - 1) + ']').length - 1;

                        if(!PP.IsConnected()) {
                            if(fd) {
                                ParupaintCanvas.AddLayer();
                                return ParupaintCanvas.Focus(l, 0);
                            } else {
                                ParupaintCanvas.RemoveLayer();
                                if(!ParupaintCanvas.Focus(l, f1)) {
                                    ParupaintCanvas.Focus(l - 1, f2);
                                }
                            }
                        } else {
			    if(PP.readonly) return;

                            var lc = (fd ? 1 : -1);
                            PP.Emit('lf', {
                                l: l,
                                f: f,
                                lc: lc
                            });
                        }
                    } else {

                        ParupaintCanvas.Advance(fd ? 1 : -1);
                    }
                    pthis.UpdateFrameinfoPosition();

                    //TODO move this somewhere else.. ?
                    var dd = [
                        $('canvas.focused').data('layer'),
                        $('canvas.focused').data('frame')
                    ]
                    PP.Emit('lf', {
                        l: dd[0],
                        f: dd[1]
                    });
                    return true;
                }
                /*
            case 46: // del
                {
                    if(isConnected()) {
                        var l = $('canvas.focused').data('layer'),
                            f = $('canvas.focused').data('frame');

                        // send net packet
                        if(data.ctrl) {
                            RoomListSocket.emit('clr', {
                                l: l,
                                f: f,
                                c: Brush.color()
                            });
                        } else {
                            RoomListSocket.emit('clr', {
                                l: l,
                                f: f
                            });
                        }

                    } else {
                        if(data.ctrl) {
                            clearCanvasFrame(Brush.color());
                        } else {
                            clearCanvasFrame('transparent');
                        }
                    }
                    break;
                }
*/
        }
    }).on('keyup', function(e) {
        switch(e.keyCode) {
            case 9:
                {
                    return(pthis.tabDown = false);
                }
            case 32:
                {
                    pthis.movingCanvas =
                        pthis.zoomingCanvas =
                        pthis.zoomingBrush = false;
                    pthis.zoomStart = null;
                    return false;
                }


        }
    }).on('mousemove', function(e) {

        // maybe clean this up someday..
        // TODO: and add zooming in to where the cursor is.
        if(pthis.zoomingBrush || pthis.zoomingCanvas) {
            if(pthis.zoomStart == null) {
                pthis.zoomStart = (e.clientY);
                if(pthis.zoomingCanvas) pthis.sizeStart = (pthis.zoom || 1.0);
            }
            var step = 5 * (pthis.sizeStart < 5 ? 0.5 : 1);
            var diff = 1 + ((pthis.zoomStart - e.clientY) * 2 /
                $(this).height());
            var res = 1 + (pthis.sizeStart *
                (diff > 0.00000000 ? diff : 1)) * diff;
            var rres = Math.floor((res - pthis.sizeStart) / step);
            var ras = (pthis.sizeStart + rres * step);

            if(pthis.zoomingBrush) {
                return console.error('brush zoom not yet implemented.'),
                    pthis.zoomingBrush = false;
                if(ras != Brush.brush().size && ras <= 128 && ras >= 1) {
                    if(ras < 0) ras = 0;
                    else if(ras > 128) ras = 128;
                    //Brush.size(ras).update()

                }
            }
            // don't know how to make this work.
            // the actual canvas-workarea changes when i set the zoom, so the diff
            // gets all messed up since it uses its' height for calculation.
            else if(pthis.zoomingCanvas) {
                var rrr = (pthis.sizeStart * (diff > 0.00000000 ? diff : 1))
                var ic = (Math.round((rrr) * 50) / 50);
                if(ic != pthis.zoom) {
                    pthis.Zoom(ic);
                }
            }

        }

    }).on('mousedown', function(e) {
        if(e.which == pthis.key_move) {
            return false;

        } else if(e.which == 1) {
            var target = $(e.target);
            if(!$('.overlay').has(target).length) {
                // okay, it's not the overlay thing.

                // check if the setting dialogs are open...
                var qs = $('.qstatus-brush, .qstatus-settings');
                if(!qs.has($(target)).length && !$(target).is(qs)) {
                    if(qs.hasClass('panel-open')) {
                        return qs.removeClass('panel-open');
                    }
                }

                // nope, okay, toggle the normal ui.
                var p = $('#mouse-pool');
                // is it not the canvases, and is it not the ui itself?
                if(!p.has(target).length && !p.is(target) &&
                    !$('.gui').has(target).length) {
                    pthis.HideOverlay();
                }
            } else {

                if($('.qstatus').has(target).length &&
                    target.hasClass('qstatus-piece')) {
                    target.parent().toggleClass('panel-open');
                    return true;

                } else if(target.hasClass('qstatus-message')) {
                    pthis.ShowOverlay(true);
                } else if(target.is('.flayer-info-frame')) {

                    var l = target.closest('.flayer-info-layer').data('layer'),
                        f = target.data('frame');

                    ParupaintCanvas.Focus(l, f);
                    pthis.UpdateFrameinfoPosition();
                    pthis.ShowOverlay(true);
                }

            }



        }
    }).on('mousewheel DOMMouseScroll', function(e) {
        var target = $(e.target);
        var wd = e.originalEvent.wheelDelta / 100,
            ed = e.originalEvent.detail * -1,
            scroll = wd || ed;

        if($('.overlay').has(target).length) {
            if(target.is('.flayer-info-frame')) {
                var p = target.closest('.flayer-info-layer');
                var l = p.data('layer'),
                    f = p.children('.flayer-info-frame.focused').data('frame');
                if(typeof f != "number") {
                    f = target.data('frame');
                }

                ParupaintCanvas.Focus(l, scroll > 0 ? f + 1 : f - 1);
                pthis.UpdateFrameinfoPosition();
                pthis.ShowOverlay(true);

            } else {
                return false;
            }
        }
        if(pthis.movingCanvas) {
            //while moving canvas
            var z = pthis.zoom || 1.0;
            z *= (scroll > 0 ? 1.2 : 0.8);
            if(z < 0.1) z = 0.1;
            else if(z > 6) z = 6;

            pthis.Zoom(z);
        }
        return false;
    });



    this.Zoom = function(z) {
        if(typeof z != "number") return this.zoom;

        var w = $('canvas').get(0).width,
            h = $('canvas').get(0).height,
            ow = $('.canvas-workarea').width(),
            oh = $('.canvas-workarea').height(),
            // change x, y
            cw = (z * w) - ow,
            ch = (z * h) - oh,
            nw = ow + cw,
            nh = oh + ch;


        var b = $(window);
        var alx = b.width() / 2,
            aly = b.height() / 2;

        var aax = (b.scrollLeft() + alx),
            aay = (b.scrollTop() + aly),
            ccx = (ow / (aax)),
            ccy = (oh / (aay));
        b.scrollTop(b.scrollTop() + (ch / ccy));
        b.scrollLeft(b.scrollLeft() + (cw / ccx));

        this.zoom = z;
        $('.canvas-workarea').width(nw).height(nh);
        $('.canvas-cursor').css('transform', 'scale(' + z + ')').
        each(function(k, e) {
            var ee = $(e),
                nx = (ee.data('x') / w) * nw,
                ny = (ee.data('y') / h) * nh
            ee.css({
                left: nx,
                top: ny
            })
        });
    }

    this.UpdateBrushinfo = function(brush) {
        if(typeof brush != "undefined") {

            var col = new ParupaintColor(brush.color);

            $('.qstatus-piece.preview-col').
            css('background-color', col.ToCssString()).
            attr('data-label', brush.name);

        }
    }
    this.UpdateFrameinfo = function() {
        var list = [];
        $('.flayer-list').html('');

        $('.canvas-pool canvas[data-frame=0]').each(function(k, e) {
            // loop through layers
            var l = $(e).data('layer');

            var fls = $('.flayer-list')
            if(fls.length) {
                if(list[l] == undefined) list[l] = $('<div/>', {
                    class: 'flayer-info-layer',
                    'data-layer': l,
                    id: ('list-flayer-' + l)
                });
                for(var f = 0; f < $('.canvas-pool canvas[data-layer=' + l + ']').length; f++) {
                    var nc = $('.canvas-pool canvas[data-layer=' + l + '][data-frame=' + f + ']');

                    var d = $('<div/>', {
                        'class': 'flayer-info-frame',
                        'id': ('list-flayer-' + l + '-' + f),
                        'data-frame': f
                    }).toggleClass('extended', nc.hasClass('extended'));

                    list[l].append(d);
                }
            }
        })
        for(var i = 0; i < list.length; i++) { //standard loop is important so that layers get in order
            $('.flayer-list').append(list[i]);
        }
        this.UpdateFrameinfoPosition();
    }

    this.UpdateFrameinfoPosition = function() {
        var sel = $('.canvas-pool canvas.position');
        if(sel.length) {
            var layer = sel.data('layer'),
                frame = sel.data('frame');

            $('.flayer-list .flayer-info-frame').removeClass('focused');

            $('.flayer-list .flayer-info-layer[data-layer=' + layer + ']').
            children('.flayer-info-frame[data-frame=' + frame + ']').
            addClass('focused');

            $('.qstatus-piece.qinfo').
            attr('data-label', layer + 1).
            attr('data-label-2', frame + 1);
        }

    }

    this.UpdatePainters = function(painters) {
        var alist = $('<ul />', {
            class: 'player-list'
        });

        painters.each(function(k, e) {
            var t = $(e);
            alist.append(
                $('<li/>', {
                    class: 'player-list-entry'
                }).text(
                    t.data('name')
                )
            );
        });
        $('.brush-panel').html(alist);

        $('.qstatus-piece.preview-col').attr('data-label-2', painters.length);
    }

    this.UpdateHeavy = function(painters) {
        if(painters) this.UpdatePainters(painters);
        this.UpdateFrameinfo();
        this.UpdateFrameinfoPosition();
        this.UpdateDimensionsInput();
    }

    this.SetConnectionStatus = function(onoff) {
        $('.qstatus-piece.qinfo').
        attr('data-label-3', (onoff ? 'multi' : 'single')).
        toggleClass('online', navigator.onLine);

        $('form.connection-input').
        toggleClass('enable', onoff).
        attr('data-label', (onoff ? 'connected' : 'disconnected'));

        $('input.con-status').prop('checked', onoff);

    }
    this.SetRoomName = function(name) {
        $('.qstatus-message').attr('data-label', name);
    }

    this.SetAdmin = function(onoff) {
        //TODO admin button to let someone else take it?
        $('body').toggleClass('is-admin', onoff);
    }

    this.SetPrivate = function(onoff) {
        $('body').toggleClass('is-private', onoff);
        $('input.private-status').prop('checked', onoff);
    }

    this.SetDimensionsInput = function(w, h) {
        var i = $('form.dimension-input');
        i.children('.dimension-w-input').val(w);
        i.children('.dimension-h-input').val(h);
    }

    this.UpdateDimensionsInput = function() {
        var d = ParupaintCanvas.Init();
        this.SetDimensionsInput(d[0], d[1]);
    }
    this.SetTabletInput = function(d){
        $('#tablet-input-id').prop('checked', d);
    }


    this.Loading = function(txt) {
        this.ClearLoading();
        if(typeof txt == "undefined") return;

        $('body').addClass('loading').
        attr('data-loading', txt);
    }
    this.ClearLoading = function() {
        $('body').removeClass('loading');
    }
    this.ConnectionError = function(txt) {
        this.ClearError();
        this.ClearLoading();
        if(typeof txt == "undefined") return;

        $('body').addClass('disconnected').
        attr('data-disconnect', txt);

    }
    this.ClearError = function() {
        $('body').removeClass('connected disconnected');
    }

    // updateInterfaceHsl
    this.updateInterface = function(hex) {
        setColorSliderHex(hex);
        setPreviewColor(hex);
    };
    this.updateFromBrush = function(brush) {
        this.updateInterface(brush.color());
    };
};
