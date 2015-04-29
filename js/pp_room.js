"use strict";

function ParupaintBrushglass() {
    this.current = 0;
    this.brushes = [
        new ParupaintBrush("brush", "#000", 2),
        new ParupaintBrush("eraser", "#00000000", 16)
    ];

    this.UpdateCursor = function(cursor) {
        if(cursor) {
            cursor.css({
                width: this.Size(),
                height: this.Size()
            });
            //okay, no color???
            cursor.toggleClass("eraser", (this.current === 1));
        }
    }

    this.Update = function(cursor, ui) {
        this.UpdateCursor(cursor);

        ui.UpdateBrushinfo(this.Brush());
    }

    this.Size = function(size, cursor) {
        if(typeof size == "undefined") return this.Brush().size;
        if(cursor.length) {
            cursor.data('size', size);
            if(cursor.hasClass('cursor-self')) {
                //todo use a faster way to check if self?
                this.brushes[this.current].size = size;
            }
        }
        return this;
    }
    this.Color = function(color, cursor) {
        if(typeof color == "undefined") return this.Brush().color;
        if(cursor.length) {
            //TODO color convertion
            cursor.data('color', color);
            if(cursor.hasClass('cursor-self')) {
                //todo use a faster way to check if self?
                this.brushes[this.current].color = color;
            }
        }
        return this;
    }
    this.Position = function(x, y) {
        if(typeof x == "undefined" ||
            typeof y == "undefined") return [this.Brush().x, this.Brush().y];

        this.Brush().x = x;
        this.Brush().y = y;
        return this;
    }

    // set/get the brush id.
    this.Brush = function(b) {
        if(b != null) {
            this.current = b;
            return this;
        }
        return this.brushes[this.current];
    }
    this.OppositeBrush = function() {
        return(this.current == 0 ? 1 : 0)
    }
    this.Name = function() {
        return this.brushes[this.current].name;
    }

    return this;
}

// don't pass any params to clean up
var ParupaintRoom = function(main, room_name) {

    // clean up.


    if(typeof room_name != "string") {
        if(main.socket !== null) {
            var clear = ["rs", "canvas"];
            for(var i in clear) {
                main.socket.callbacks[i] = null;
            }
        }
        return null;
    }
    this.name = room_name;
    this.artists = [];
    this.slow_move = false; // roundtrip to server

    this.brush = new ParupaintBrushglass();
    this.key_eraser = 3;

    this.picking_color = false;
    this.pick_canvas = null;

    this.mouseTimer = null;

    this.admin = null;
    this.Admin = function(cursor) {
        //TODO loop this.artists and remove admin
        if(cursor !== null) {
            $('.canvas-cursor').removeClass('admin');

            cursor.cursor.addClass('admin');
            this.admin = cursor;
        }
        return this.admin;
    }

    this.private = false;
    this.Private = function(onoff) {
        if(typeof onoff == "boolean") {
            this.private = onoff;
            $('body').toggleClass('is-private', onoff);
        } else {
            return this.private;
        }
    }




    this.urlsafe_name = function() {
        // safen the room_name for hash
        return room_name;
    }();
    document.location.hash = this.urlsafe_name;


    console.log("ParupaintRoom finished for [" + room_name + "].");

    this.SetNetwork = function(onoff) {
        document.title = '[' + room_name + ']';
        var rthis = this;

        if(onoff) {
            // put network code here that affects the canvas ONLY
            console.info("Setting up network events.");
            main.socket.on('rs', function(d) {
                // data
                if(typeof d.admin != "undefined") {

                    if(d.admin == main.Cursor().Id()) {
                        //me!
                        $('body').addClass('is-admin');
                        rthis.Admin(main.Cursor());
                    } else {
                        var c = main.Cursor('#' + d.admin);
                        if(c == null) {
                            return console.error("Admin cursor doesn't exist!")
                        }
                        rthis.Admin(c);
                    }
                }
                if(typeof d.private != "undefined") {
                    rthis.Private(d.private);
                }
            });
            main.socket.on('canvas', function(d) {
                console.info('New canvas [' + d.width + ' x ' + d.height + ' : ' + d.layers.length + ' layers].');
                if(d.layers != undefined) { // create new
                    ParupaintCanvas.Init(d.width, d.height, d.layers)
                } else {
                    ParupaintCanvas.Init(d.width, d.height)
                }
                main.ui.UpdateFrameinfo();
                ParupaintCanvas.Focus(0, 0);
                main.Emit('img');
            });
            main.socket.on('img', function(d) {
                var l = parseInt(d.l),
                    f = parseInt(d.f),
                    decodedData = window.atob(d.data),
                    binData = new Uint8Array(decodedData.split('').
                    map(function(x) {
                        return x.charCodeAt(0);
                    })),

                    data = pako.inflate(binData),
                    iw = parseInt(d.w),
                    ih = parseInt(d.h),
                    bpp = 4;

                var e = $('#flayer-' + l + '-' + f);
                if(e.length) {
                    var ctx = e.get(0).getContext('2d');
                    var cc = ctx.createImageData(iw, ih);
                    for(var i = 0, len = cc.data.length; i < len; i += 4) {
                        cc.data[i] = data[i + 2];
                        cc.data[i + 1] = data[i + 1];
                        cc.data[i + 2] = data[i];
                        cc.data[i + 3] = data[i + 3];
                    }
                    ctx.putImageData(cc, 0, 0)
                }
            });
        }
    }
    this.SetNetwork(false);
    this.OnOpen = function(e) {
        this.SetNetwork(true);
    }
    this.OnClose = function(e) {
        this.SetNetwork(false);
    }
    if(main.IsConnected()) {
        this.SetNetwork(true);
    }

    // THIS OBJECT IS ONLY FOR CONTROLLING CANVASES AND CURSORS AND WHAT NOT!
    // THIS IS NOT FOR CONTROLLING UI STUFF, EXCEPT UPDATING THEM.

    // funcs for updating interface etc, through UI object?
    // get painters, update all painters, get num painters etc
    // do network/callback/canvas funcs object

    var pthis = this;
    $('#mouse-pool').sevent(function(e, data) {
        if(e == 'mousemove' && data.target.tagName == 'CANVAS') {
            if(main.ui.movingCanvas) {
                let b = $(window);
                b.scrollLeft(b.scrollLeft() - data.sx);
                b.scrollTop(b.scrollTop() - data.sy);
                return true;

            } else if(pthis.picking_color) {
                if(pthis.pick_canvas.length) {
                    var x = pthis.brush.Position()[0],
                        y = pthis.brush.Position()[1];

                    var px = pthis.pick_canvas.get(0).
                    getContext('2d').getImageData(x, y, 1, 1).data;

                    var r = ('00' + px[0].toString(16)).slice(-2),
                        g = ('00' + px[1].toString(16)).slice(-2),
                        b = ('00' + px[2].toString(16)).slice(-2),
                        a = ('00' + px[3].toString(16)).slice(-2);
                    var hex = "#" + ("00000000" + (r + g + b + a)).slice(-8);

                    if(hex != pthis.brush.Color()) {
                        pthis.brush.Color(hex, main.Cursor().cursor).
                        Update(main.Cursor().cursor, main.ui);

                        main.Cursor().cursor.css('background-color',
                            'rgba(' +
                            px[0] + ',' +
                            px[1] + ',' +
                            px[2] + ',' +
                            px[3] / 255 + ')');
                    }


                }

            }
            let drawing = (data.button == 1);
            var plugin = document.getElementById('wacomPlugin');

            // original dimensions and new (zoomed) dimensions
            var ow = $('canvas.focused').get(0).width,
                oh = $('canvas.focused').get(0).height,
                nw = $('.canvas-workarea').width(),
                nh = $('.canvas-workarea').height();

            // brush information
            var mx = (data.x / nw) * ow,
                my = (data.y / nh) * oh,
                s = pthis.brush.Size(),
                c = pthis.brush.Color();

            var cc = main.Cursor();
            var cursor = cc.cursor;
            if(cursor.length) {

                var left = parseInt(cursor.css('left')),
                    top = parseInt(cursor.css('top'));

                var dx = (data.x - left),
                    dy = (data.y - top);

                var dist = Math.sqrt(dx * dx + dy * dy);

                var color = cursor.hasClass('pick-color');

                // use a higher distance when not drawing to skip updating more
                if(color || dist > (drawing ? 2 : 15)) {
                    var set_cursor = function(x, y) {
                        cursor.css({
                            left: x,
                            top: y
                        });
                        pthis.brush.Position(x, y);
                    };
                    set_cursor(data.x, data.y);

                    if(!drawing && !color) {

                        main.Emit('draw', {
                            x: mx,
                            y: my,
                            s: s,
                            c: c,
                            d: false
                        });

                    }
                    if(pthis.mouseTimer) clearTimeout(pthis.mouseTimer);
                    pthis.mouseTimer = setTimeout(function() {
                        set_cursor(data.x, data.y);
                    }, 800);
                }
            }

            // tablet hokus pokus
            var tabletPressure = null; {

                var tabletSwitch = function(e) {
                    //TODO fix
                    Brush.switchToBrush(er);
                    guiControl.updateFromBrush(Brush);


                    net.Emit('draw', {
                        x: mx,
                        y: my,
                        s: s,
                        c: c,
                        d: false
                    });
                };

                // switch brush if tablet pen has flipped
                if(typeof tabletConnection != "undefined" &&
                    tabletConnection.connections) {

                    // check if different and is allowed to switch
                    if(tabletConnection.e != Brush.cbrush &&
                        tabletConnection.autoswitch) {
                        // switch it
                        tabletSwitch(parseInt(tabletConnection.e));
                    }
                    tabletPressure = tabletConnection.p;
                }
                if(plugin && plugin.penAPI) {
                    // bool to int
                    var er = plugin.penAPI.isEraser ? 1 : 0;

                    if(tabletConnection.autoswitch &&
                        Brush.cbrush != er) {
                        tabletSwitch(er)
                    }
                    if(plugin.penAPI.pointerType != 0) {
                        tabletPressure = plugin.penAPI.pressure;
                    }
                }
            }

            // we might actually be drawing right now.
            if(drawing) {

                // get the.. change?
                var nx1 = ((data.x - data.cx) / nw) * ow;
                var ny1 = ((data.y - data.cy) / nh) * oh;

                // pressure
                if(typeof tabletPressure == "number") {

                    var ns = null;

                    if(tabletPressure != null) {
                        ns = tabletPressure;
                    } else if(data.mozPressure) {
                        // just test mozPressure, doubtful if it works
                        ns = data.mozPressure;
                    }

                    if(ns != null) {
                        var ps = cursor.children('.cursor-pressure-size');
                        if(ps.length) {
                            // multiply the caches size so it affects everything
                            s *= ns;

                            var ss = Math.round(ns * 10) / 10;
                            if(ps.data('ts') != ss) {
                                ps.css({
                                    'transform': 'scale(' + ns + ') translate(-50%, -50%)'
                                }).data('ts', ss);
                            }
                        }
                    }
                }
                if(s != 0.0) {
                    main.Emit('draw', {
                        x: mx,
                        y: my,
                        s: s,
                        c: c,
                        d: true
                    });
                    if(!pthis.slow_move) {
                        ParupaintCanvas.DrawLine(
                            $('canvas.focused'), nx1, ny1,
                            mx, my, c, s);
                    }
                }
            }


        } else if(e == 'mousedown') {
            var plugin = document.getElementById('wacomPlugin');
            if(plugin && plugin.penAPI) {
                // ???
                // no idea why i added this here
            }
            if(data.button == pthis.key_eraser) {
                var nb = pthis.brush.OppositeBrush();
                //autoswitch = false

                if(!pthis.slow_move) {
                    pthis.brush.Brush(nb).
                    Update(main.Cursor().cursor, main.ui);
                }
                //TODO emit
                main.Emit('draw', {
                    x: pthis.brush.Position()[0],
                    y: pthis.brush.Position()[1],
                    s: pthis.brush.Size(),
                    c: pthis.brush.Color(),
                    d: false
                })

            }
        } else if(e == 'mouseup') {
            let c = main.Cursor();
            if(c != null) {
                c.cursor.children('.cursor-pressure-size').removeAttr('style');
                // clear pressure sensitivity marker
            }
        } else if(e == 'mouseout') {

            main.Emit('draw', {
                x: pthis.brush.Position()[0],
                y: pthis.brush.Position()[1],
                s: pthis.brush.Size(),
                c: pthis.brush.Color(),
                d: false
            })

        } else if(e == 'mousewheel') {
            if(!(main.ui.zoomingCanvas && main.ui.movingCanvas)) {
                var a = data.scroll > 0 ? 2 : 0.5;

                if(true) {
                    var s = pthis.brush.Size() * a;
                    if(s < 1) s = 1;
                    if(s > 256) s = 256;

                    pthis.brush.
                    Size(s, main.Cursor().cursor).
                    Update(main.Cursor().cursor, main.ui);


                    main.Emit('draw', {
                        x: pthis.brush.Position()[0],
                        y: pthis.brush.Position()[1],
                        s: s,
                        c: pthis.brush.Color(),
                        d: false
                    });

                }
            }
        } else if(e == 'keyup') {
            if($('input:focus, textarea:focus').length) return true;
            switch(data.key) {
                case 82: // r
                    {
                        // TODO trigger new palette

                        main.Cursor().cursor.removeClass('pick-color');
                        return(pthis.picking_color = false);
                    }
            }
        } else if(e == 'keydown') {

            if($('input:focus, textarea:focus').length) return true;
            switch(data.key) {
                case 49: // 1
                case 50:
                case 51:
                case 52:
                case 53: // 5
                    {
                        var k = (data.key - 48) - 1;
                        var sizes = [
                            1,
                            3,
                            6,
                            16,
                            64
                        ];
                        this.brush.Size(sizes[k]).
                        Update(main.Cursor().cursor, main.ui);

                        main.Emit('draw', {
                            x: pthis.brush.Position()[0],
                            y: pthis.brush.Position()[1],
                            s: s,
                            c: pthis.brush.Color(),
                            d: false
                        });

                        return false;
                    }
                case 82: // r
                    {
                        if(data.ctrl) {
                            // pick color from all canvases
                        } else if(data.shift) {
                            main.Emit('img');
                        } else {
                            if(!pthis.picking_color) {
                                pthis.picking_color = true;
                                main.Cursor().cursor.addClass('pick-color');
                                pthis.pick_canvas = $('canvas.focused');
                            }
                        }
                        break;
                    }
                case 69: // e
                    {
                        var nb = pthis.brush.OppositeBrush();
                        //autoswitch = false

                        if(!pthis.slow_move) {
                            pthis.brush.Brush(nb).
                            Update(main.Cursor().cursor, main.ui);
                        }
                        //TODO emit
                        main.Emit('draw', {
                            x: pthis.brush.Position()[0],
                            y: pthis.brush.Position()[1],
                            s: pthis.brush.Size(),
                            c: pthis.brush.Color(),
                            d: false
                        });

                        // make sure the tablet doesn't immediately
                        // switch back to brush mode
                        //FIXME
                        //tabletConnection.autoswitch = false;
                        break;
                    }
            }
        }
    }).bind('contextmenu', function(e) {
        return false;
    })


}
