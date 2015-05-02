"use strict";

// Brush glass
// Keeps a record of brushes and handy functions for them
function ParupaintBrushglass() {
    this.current = 0;
    this.brushes = [
        new ParupaintBrush("brush", "#000", 2),
        new ParupaintBrush("eraser", "#00000000", 16)
    ];

    this.UpdateCursor = function(cursor) {
        if(cursor) {
            cursor.Size(this.Size());
            cursor.Color(this.Color());
            cursor.cursor.toggleClass("eraser", (this.current === 1));
        }
    }

    this.UpdateLocal = function() {

        this.UpdateCursor(PP.Cursor());
        PP.ui.UpdateBrushinfo(this.Brush());
        ParupaintStorage.SetStorageKey({
            'default_brush': this.brushes
        });
    }

    // Functions to reflect the important brush variables
    // do not store X,Y or whatever.


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
    this.Size = function(size, cursor) {
        if(typeof size == "undefined") return this.Brush().size;

        this.brushes[this.current].size = size;
        if(cursor) cursor.Size(size);

        return this;
    }
    this.Color = function(color, cursor) {
        if(typeof color == "undefined") return this.Brush().color;

        this.brushes[this.current].color = color;
        if(cursor) cursor.Color(color);

        return this;
    }

    return this;
}

// don't pass any params to clean up
var ParupaintRoom = function(main, room_name) {

    // clean up.

    if(main.socket !== null) {
        var clear = ["rs", "lf", "draw"];
        for(var i in clear) {
            main.socket.callbacks[i] = null;
        }
    }

    if(typeof room_name != "string") {
        return null;
    }


    var pthis = this;
    this.name = room_name;
    this.server_roundtrip = false; // roundtrip to server
    //TODO finish this up

    this.brush = new ParupaintBrushglass();
    ParupaintStorage.GetStorageKey('default_brush', function(d) {
        if(d != null) {
            if(typeof d == "string") d = JSON.parse(d);
            pthis.brush.brushes = d;
        }
    });
    this.brush.UpdateLocal();
    this.key_eraser = 3;

    this.picking_color = false;
    this.pick_canvas = null;

    this.autoswitch = false;

    this.mouseTimer = null;

    this.urlsafe_name = function() {
        // safen the room_name for hash
        return room_name;
    }();



    this.admin = null;
    this.Admin = function(cursor) {
        if(typeof cursor != "undefined" && cursor) {
            $('.canvas-cursor').removeClass('admin');

            cursor.cursor.addClass('admin');
            main.ui.SetAdmin(cursor.IsMe());

            this.admin = cursor;
        }
        return this.admin;
    }

    this.private = false;
    this.Private = function(onoff) {
        if(typeof onoff == "boolean") {
            this.private = onoff;
            main.ui.SetPrivate(onoff);
        } else {
            return this.private;
        }
    }

    this.GetCanvasKey = function() {
        return "room_" + this.name;
    }

    this.GetCanvas = function(callback) {
        ParupaintStorage.GetStorageKey(this.GetCanvasKey(),
            function(key) {
                if(typeof key == "string") key = JSON.parse(key)
                if(typeof callback == "function") callback(key);
            });
    };
    //TODO actually make this work.
    this.SaveCanvas = function(callback) {
        var ke = this.GetCanvasKey();

        this.GetCanvas(function(key) {

            var kk = {};
            var ra = {};
            if(typeof key != "undefined" && key) ra = key;

            console.info('Saving room to storage.', key);

            var d = ParupaintCanvas.Init();
            ra.width = d[0];
            ra.height = d[1];
            ra.data = [];

            $('.canvas-pool canvas').each(function(k, e) {
                var l = $(e).data('layer'),
                    f = $(e).data('frame'),
                    bytes = e.toDataURL();

                if(typeof ra.data[l] == "undefined") {
                    ra.data[l] = [];
                }
                if(typeof ra.data[l][f] == "undefined") {
                    ra.data[l][f] = {};
                }

                ra.data[l][f].data = bytes;

            });

            kk[ke] = ra;
            ParupaintStorage.SetStorageKey(kk, function() {
                if(typeof callback == "function") callback();
            })
        });
    }




    main.ui.SetRoomName(room_name);
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

                    var c = main.Cursor('#' + d.admin);
                    if(c == null) {
                        return console.error("Admin cursor doesn't exist!")
                    }
                    rthis.Admin(c);
                    $('body').toggleClass('is-admin', c.IsMe());
                }
                rthis.Private(d.password);
                main.Update();
            });

            // not sure if the rest needs to be initiated
            // every time a room is created...

            main.socket.on('lf', function(d) {

                var l = parseInt(d.l),
                    f = parseInt(d.f);

                var c = main.Cursor(d.id);
                if(c === null) return console.error("Cursor doesn't exist.");
                if(rthis.server_roundtrip && c.IsMe()) {
                    ParupaintCanvas.Focus(l, f);
                    main.ui.UpdateHeavy();
                }
                c.LayerFrame(l, f);
                //console.info('Changed layers to '+ c.LayerFrame() +'.');
            });
            main.socket.on('draw', function(d) {
                var x = d.xo, // net original x
                    y = d.yo, // net original y
                    l = d.l, // net l
                    f = d.f, // net f

                    // required
                    xx = d.x, // net x
                    yy = d.y, // net y
                    ss = d.s, // net size
                    cc = d.c, // net color
                    dd = d.d; // net drawing



                if(typeof d.id != "undefined") {
                    //someone.
                    var c = main.Cursor(d.id);
                    if(c === null) {
                        return console.error("Cursor doesn't exist.");
                    }
                    if(!rthis.server_roundtrip && c.IsMe()) {
                        // ignore this is this is me and roundtrip is off
                        return false;
                    }
                    var od = ParupaintCanvas.Init(),
                        nd = [
                            $('.canvas-workarea').width(),
                            $('.canvas-workarea').height()
                        ];

                    // get saved position
                    var pp = c.Position(),
                        lf = c.LayerFrame();

                    if(!c.IsMe()) {

                        if(typeof xx != "undefined" &&
                            typeof yy != "undefined") {

                            c.Position((xx / od[0]) * nd[0], (yy / od[1]) * nd[1]);
                        }
                        if(typeof ss != "undefined") c.Size(ss);
                        if(typeof cc != "undefined") c.Color(cc);
                        if(typeof l != "undefined" &&
                            typeof f != "undefined") {
                            c.LayerFrame(l, f);
                            lf[0] = l;
                            lf[1] = f;
                        }
                        // save the 'raw' cursor pos.
                        c.cursor.data({
                            dx: xx,
                            dy: yy
                        });
                    }
                    if(typeof dd != "undefined" &&
                        dd != c.Drawing()) {
                        if(dd) {
                            //starting to draw
                            pp[0] = xx, pp[1] = yy;
                        }
                        c.Drawing(dd);
                    }
                    if(c.Drawing() &&
                        typeof lf[0] == "number" &&
                        typeof lf[1] == "number" &&
                        typeof xx != "undefined" &&
                        typeof yy != "undefined") {

                        var canvas = $('.canvas-pool canvas').
                        filter('[data-layer=' + lf[0] + '][data-frame=' + lf[1] + ']');
                        ParupaintCanvas.DrawLine(canvas,
                            pp[0], pp[1], xx, yy, cc, ss);
                    }
                } else {
                    var canvas = $('.canvas-pool canvas').
                    filter('[data-layer=' + l + '][data-frame=' + f + ']');
                    ParupaintCanvas.DrawLine(canvas,
                        x, y, xx, yy, cc, ss);
                }

            })

        }
    }
    this.SetNetwork(false);
    this.OnOpen = function(e) {
        this.SetNetwork(true);
    }
    this.OnClose = function(e) {
        this.SetNetwork(false);
        $('.canvas-cursor:not(.cursor-self)').remove();
        $('.canvas-cursor.cursor-self').removeClass('admin');
    }


    if(main.IsConnected()) {
        this.SetNetwork(true);

        var lf = main.Cursor().LayerFrame();
        main.Emit('lf', {
            l: lf[0],
            f: lf[1]
        });
    } else {
        console.info('Not connected, creating a blank canvas.');
        ParupaintCanvas.Init(800, 800, [
            [{}]
        ]);

        main.Update();
        ParupaintCanvas.Focus(0, 0);
        main.ui.UpdateHeavy();

        this.GetCanvas(function(key) {
            if(key) {
                var w = key.width || 800,
                    h = key.height || 800;

                ParupaintCanvas.Init(w, h, key.data);

                ParupaintCanvas.Focus(0, 0);
                main.ui.UpdateHeavy();
            }
        })
    }

    // THIS OBJECT IS ONLY FOR CONTROLLING CANVASES AND CURSORS AND WHAT NOT!
    // THIS IS NOT FOR CONTROLLING UI STUFF, EXCEPT UPDATING THEM.

    // funcs for updating interface etc, through UI object?
    // get painters, update all painters, get num painters etc
    // do network/callback/canvas funcs object


    $('form.password-input').unbind().submit(function(e) {
        var p = $(this).children('.password-change').val();
        if(pthis.Admin()) {
            main.Emit('rs', {
                password: p
            });
        }
        return false;
    })

    $('#mouse-pool').unbind().sevent(function(e, data) {

        if(e == 'mousemove' && data.target.tagName == 'CANVAS') {

            if(main.ui.movingCanvas || (data.button == main.ui.key_move)) {
                var b = $(window);
                b.scrollLeft(b.scrollLeft() - data.sx);
                b.scrollTop(b.scrollTop() - data.sy);
                return true;

            } else if(pthis.picking_color) {

                if(pthis.pick_canvas.length) {
                    var x = data.x,
                        y = data.y;

                    var px = pthis.pick_canvas.get(0).
                    getContext('2d').getImageData(x, y, 1, 1).data;

                    var r = ('00' + px[0].toString(16)).slice(-2),
                        g = ('00' + px[1].toString(16)).slice(-2),
                        b = ('00' + px[2].toString(16)).slice(-2),
                        a = ('00' + px[3].toString(16)).slice(-2);
                    var hex = "#" + ("00000000" + (r + g + b + a)).slice(-8);

                    if(hex != pthis.brush.Color()) {
                        pthis.brush.Color(hex, main.Cursor()).UpdateLocal();

                        main.Cursor().cursor.css('background-color',
                            'rgba(' +
                            px[0] + ',' +
                            px[1] + ',' +
                            px[2] + ',' +
                            px[3] / 255 + ')');
                    }


                }

            }
            var drawing = (data.button == 1);
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
                // move the cursor.

                var left = parseInt(cursor.css('left')),
                    top = parseInt(cursor.css('top'));

                var dx = (data.x - left),
                    dy = (data.y - top);

                var dist = Math.sqrt(dx * dx + dy * dy);

                var color = cursor.hasClass('pick-color');

                // use a higher distance when not drawing to skip updating more
                if(color || dist > (drawing ? 2 : 15)) {

                    if(!drawing && !color) {
                        main.Emit('draw', {
                            x: mx,
                            y: my,
                            s: s,
                            c: c,
                            d: false
                        });
                    }

                    if(!pthis.server_roundtrip) {
                        cc.Position(data.x, data.y);
                    }
                    if(!pthis.server_roundtrip) {
                        if(pthis.mouseTimer) clearTimeout(pthis.mouseTimer);
                        pthis.mouseTimer = setTimeout(function() {
                            cc.Position(data.x, data.y);
                        }, 800);
                    }
                }
            }

            // tablet hokus pokus
            var tabletPressure = null; {

                var tabletSwitch = function(e) {
                    pthis.brush.Brush(e).UpdateLocal();

                    var cc = main.Cursor();
                    main.Emit('draw', {
                        x: cc.Position()[0],
                        y: cc.Position()[1],
                        s: pthis.brush.Size(),
                        c: pthis.brush.Color(),
                        d: false
                    });
                    //TODO put d as cc.Drawing()?
                };

                var eraser = pthis.brush.current;
                // switch brush if tablet pen has flipped
                if(plugin && plugin.penAPI) {
                    eraser = plugin.penAPI.isEraser ? 1 : 0;
                    if(plugin.penAPI.pointerType != 0) {
                        tabletPressure = plugin.penAPI.pressure;
                    }

                }
                if(typeof tabletConnection != "undefined" &&
                    tabletConnection.connections) {
                    eraser = parseInt(tabletConnection.e);
                    tabletPressure = tabletConnection.p;
                }
                if(eraser != pthis.brush.current) {
                    tabletSwitch(eraser);
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
                    if(!pthis.server_roundtrip) {
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

                pthis.brush.Brush(nb).UpdateLocal();

                main.Emit('draw', {
                    x: data.x,
                    y: data.y,
                    s: pthis.brush.Size(),
                    c: pthis.brush.Color(),
                    d: false
                })

            }
        } else if(e == 'mouseup') {
            var c = main.Cursor();
            if(c != null) {
                c.cursor.children('.cursor-pressure-size').removeAttr('style');
                // clear pressure sensitivity marker
            }
        } else if(e == 'mouseout') {

            main.Emit('draw', {
                x: data.x,
                y: data.y,
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
                    Size(s, main.Cursor()).UpdateLocal();

                    var cc = main.Cursor();
                    main.Emit('draw', {
                        x: cc.Position()[0],
                        y: cc.Position()[1],
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
                        pthis.brush.Size(sizes[k]).UpdateLocal();

                        var cc = main.Cursor();
                        main.Emit('draw', {
                            x: cc.Position()[0],
                            y: cc.Position()[1],
                            s: pthis.brush.Size(),
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

                        pthis.brush.Brush(nb).UpdateLocal();

                        var cc = main.Cursor();
                        main.Emit('draw', {
                            x: cc.Position()[0],
                            y: cc.Position()[1],
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
