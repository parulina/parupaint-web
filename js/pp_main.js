"use strict";

console.info("Initializing parupaint-web, paru (c) 2014");

function Parupaint() {
    // socket, etc
    var private_var = true;
    this.public_var = false;


    this.server_url = 'sqnya.se:1108';
    this.default_room = 'sqnya';


    this.room = null;
    this.myId = "";
    this.painters = [];

    this.socket = new ParupaintSocket('ws://' + this.server_url + '/main');

    this.ui = new ParupaintInterface();
    this.chat = new ParupaintChat();
    this.color = new ParupaintSwatch();
    this.brush = new ParupaintBrushglass();
    this.admin = null;

    var pthis = this;

    // Save + load canvas data
    this.GetCanvasKey = function() {
        return "room_canvas";
    }
    this.GetCanvas = function(callback) {
        ParupaintStorage.GetStorageKey(this.GetCanvasKey(),
            function(key) {
                if(typeof key == "string") key = JSON.parse(key)
                if(typeof callback == "function") callback(key);
            });
    };
    this.SaveCanvas = function(callback) {
        var key = this.GetCanvasKey();

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



    this.Connect = function() {
        var pthis = this;
        this.socket.Connect();
    }
    this.IsConnected = function() {
        return(this.socket.IsConnected());
    }
    this.Emit = function(id, data) {
        if(this.IsConnected()) {
            this.socket.emit(id, data);
            return true;
        }
        return false;
    }
    this.SetConnected = function(onoff) {
        $('body').toggleClass('connected', onoff);
        $('body').removeClass('disconnected');
        this.ui.SetConnectionStatus(onoff);
    }

    this.Id = function(i) {
        if(typeof i == "string") this.myId = i;
        return this.myId;
    }


    // Cursor object
    // this is to control the cursor and save data in .data calls
    // REMEMBER, CURSOR IS ONLY FOR MANIPULATING THE ACTUAL DOM.
    this.Cursor = function(thing) {
            var pthis = this;

            var cur = new function(c) {
                this.cursor = null;
                this.Name = function(n) {
                    if(this.cursor == null) return "";

                    if(typeof n == "string") this.cursor.data('name', n);
                    else return this.cursor.data('name');
                };

                this.Position = function(x, y) {
                    if(this.cursor == null) return [0, 0];

                    if(typeof x == "number" &&
                        typeof y == "number") {
                        this.cursor.css({
                            left: x,
                            top: y
                        });

                    } else return [
                        parseFloat(this.cursor.css('left')),
                        parseFloat(this.cursor.css('top')),
                    ];
                };
                this.CanvasPosition = function(x, y) {
                    if(this.cursor == null) return [0, 0];

                    if(typeof x == "number" &&
                        typeof y == "number") {
                        this.cursor.data({
                            x: x,
                            y: y
                        });

                    } else return [
                        parseFloat(this.cursor.data('x')),
                        parseFloat(this.cursor.data('y')),
                    ];
                };
                this.LayerFrame = function(l, f) {
                    if(this.cursor == null) return [0, 0];

                    if(typeof l == "number" &&
                        typeof f == "number") {
                        this.cursor.data({
                            layer: l,
                            frame: f
                        });

                    } else return [
                        parseInt(this.cursor.data('layer')),
                        parseInt(this.cursor.data('frame')),
                    ];
                };
                this.Size = function(s) {
                    if(this.cursor == null) return 0;

                    if(typeof s == "number") {
                        this.cursor.css({
                            width: s,
                            height: s,
                        }).data('size', s);
                    } else return this.cursor.data('size');
                };
                this.Color = function(c) {
                    if(this.cursor == null) return 0;

                    if(typeof c == "string") {
                        this.cursor.data('color', c);
                    } else return this.cursor.data('color');
                };
                this.Drawing = function(d) {
                    if(this.cursor == null) return 0;

                    if(typeof d == "boolean") {
                        this.cursor.data('drawing', d);
                    } else return this.cursor.data('drawing');
                };
                this.Id = function() {
                    if(this.cursor == null) return "";
                    if(!this.cursor.hasClass('cursor-self')) {
                        return this.cursor.attr('id');
                    } else return pthis.Id();
                };
                this.IsMe = function() {
                    return (this.Id() == pthis.Id());
                };
                return this;
            };

            if(typeof thing == "string") {
                var d = thing.replace(/#/, "");
                if(d == pthis.myId) {
                    cur.cursor = $('.canvas-cursor.cursor-self');
                } else {
                    cur.cursor = $(thing);
                }

            } else if(typeof thing == "undefined") {
                cur.cursor = $('.canvas-cursor.cursor-self');

            } else if(typeof thing == "object") {
                cur.cursor = thing;
            }

            return cur;
    };
    this.ResetBody = function() {
        $('body').removeClass(
            'is-private is-admin loading'
        );
    }

    this.UpdatePainters = function() {
        this.painters = $('.canvas-cursor:not(.cursor-self)');
        this.ui.UpdatePainters(this.painters)
    }
    this.Update = function() {
        this.UpdatePainters();

	var d = ParupaintCanvas.Init(); // get dimensions
	var ll = [
	'[' + (this.IsConnected() ? "Connected" : "Disconnected") + ']',
	this.painters.length + ' artists',
	'[' + d[0] + '×' + d[1] + ']'
	];

	document.title = ll.join(' ');
    }

    this.Admin = function(cursor) {
        if(typeof cursor != "undefined" && cursor) {
            $('.canvas-cursor').removeClass('admin');

            cursor.cursor.addClass('admin');
            pthis.ui.SetAdmin(cursor.IsMe());

            pthis.admin = cursor;
        }
        return pthis.admin;
    }

    this.color.OnColor = function(rgba){

        var c = new ParupaintColor(rgba.r, rgba.g, rgba.b, rgba.a);
        var hex = c.ToHex();
        console.info('New color.', rgba, hex);

        pthis.brush.Color(hex, pthis.Cursor()).UpdateLocal(pthis);
    }
    this.brush.UpdateLocal(this);
}



var PP = null;
$(function() {

    PP = new Parupaint();

    var default_width = 540,
    	default_height = 540;

    var newCanvasHardReset = function(){
        PP.Update();
	ParupaintCanvas.Focus(0, 0);
	PP.ui.UpdateHeavy();
    };

    ParupaintCanvas.Init(default_width, default_height, [
	    [{}]
    ]);
    PP.GetCanvas(function(key) {
	if(key) {
	    var w = key.width || default_width,
	        h = key.height || default_height;

	    ParupaintCanvas.Init(w, h, key.data);
	    newCanvasHardReset();
	}
    });
    newCanvasHardReset();

    ParupaintStorage.GetStorageKey('default_brush', function(d) {
        if(d != null) {
            if(typeof d == "string") d = JSON.parse(d);
            PP.brush.brushes = d;
	    PP.brush.UpdateLocal(PP);
        }
    });

    ParupaintStorage.GetStorageKey('name', function(d) {
        var name = d;
        if(typeof name != "string") {
            name = prompt('Set name.');
            if(!name) {
                console.warn("Fine, if that's what you want.");
                name = ('unnamed_mofo' + (Date.now().toString().slice(-5)));
            }
            ParupaintStorage.SetStorageKey({
                name: name
            });
        }
        PP.Cursor().Name(name);
    })

    // TABLET SETUP
    // TODO chrome specific tablet set-up?
    var SetTablet = function(d) {
        PP.ui.SetTabletInput(d);

        if(ParupaintChrome.IsChrome()){
            ParupaintChrome.Tablet(d);
        } else {
            // wacom
            $('#wacomPlugin').remove();
            if(d) {
                $('body').prepend(
                    $('<object/>', {
                        id: 'wacomPlugin',
                        type: 'application/x-wacomtabletplugin'
                    })
                );

                var w = document.getElementById('wacomPlugin');
                try {
                    w.penAPI;
                } catch(e) {
                    console.error('Cannot access wacom plugin.');
                    document.body.removeChild(w);
                }
            }
        }
    }
    ParupaintStorage.GetStorageKey('tablet', function(d) {
        if(d) {
            if(ParupaintChrome.IsChrome()){
                console.info("Setting up Chrome tablet access.");
            } else {
                console.info("Setting up Wacom Tablet plug-in.");
            }
            SetTablet(d);
        }
    });

    if(navigator.onLine) {
        PP.Connect();
    }

    var manual_disconnect = false;
    // ONE-TIME SOCKET SETUP
    PP.socket.on('id', function(id) {
        console.info('You are (' + id + ').');
        PP.Id(id);
    });
    PP.socket.on('open', function(e) {
        console.log("Opened connection.");

        manual_disconnect = false;
        // FIXME this is for debug only.
        // i shall change the join to be automatically
        // in the server later.

        PP.socket.emit('join', {
            room: PP.default_room,
            name: PP.Cursor().Name()
        });



        PP.SetConnected(true);
        if(PP.room !== null) {
            PP.room.OnOpen(e);
        }
    });
    PP.socket.on('close', function(e) {
        PP.SetConnected(false);
        $('.canvas-cursor:not(.cursor-self)').remove();
        $('.canvas-cursor.cursor-self').removeClass('admin');
	
        if(!manual_disconnect){
            PP.ui.ConnectionError("socket closed.");
        }

        PP.ui.SetPrivate(false);
        PP.ui.SetAdmin(false);
        //TODO add chat message


    });
    PP.socket.on('error', function(d) {
        //PP.ui.ConnectionError("error connecting to server.");
        console.error('Websocket error', d);
        if(PP.room == null) {
            setTimeout(function() {
                PP.ui.ClearLoading();
            }, 1000);
        }

        //
    })
    PP.socket.on('join', function(d) {
        //console.warn("Server wants us to join [" + d.name + "]");
        if(d.code) {
            //todo show error
            console.error("Error joining room.", d);
            var p = null;
            if(d.code == 2) {
                p = prompt("room requires a password");
            } else if(d.code == 3) {
                p = prompt("invalid password")
            }

            if(p === null) {
                PP.socket.Close();
                manual_disconnect = true;
                PP.ui.ClearLoading();
            } else {
                PP.Emit('join', {
                    room: d.name,
                    password: p
                });
            }
            return;
        }
        PP.ui.ClearLoading();

    });
    PP.socket.on('leave', function(d) {
        console.warn("Got websocket message to leave.");
	// TODO remove all ppls
        PP.ui.ConnectionError('you were kicked.')
    });

    // canvas specific events
    PP.socket.on('canvas', function(d) {
        console.info('New canvas [' + d.width + ' x ' + d.height + '] : ' + (typeof d.layers != "undefined" ? d.layers.length : 'no') + ' layers.');

        if(d.layers != undefined) { // create new
            ParupaintCanvas.Init(d.width, d.height, d.layers)
        } else {
            ParupaintCanvas.Init(d.width, d.height)
        }
        ParupaintCanvas.Focus(0, 0);
        PP.ui.UpdateHeavy();
        PP.Update();
        PP.Emit('img');
    });
    PP.socket.on('img', function(d) {
        var l = parseInt(d.l),
            f = parseInt(d.f),
            decodedData = window.atob(d.data),
            binData = new Uint8Array(decodedData.split('').map(function(x) {
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

    // chat
    PP.socket.on('chat', function(d) {
        PP.chat.Message({
            msg: d.message,
            name: d.name,
            time: d.time
        });
    });

    PP.socket.on('peer', function(d) {

        console.info('Peer connected [' + d.id + '] (' + d.name + ').');
        var id = $('#painter-' + d.id);
        if(d.disconnect && id.length) {
            id.remove();
        } else if(!d.disconnect && d.id > 0) {
            var cursor = $('<div/>', {
                class: 'canvas-cursor',
                id: 'painter-' + d.id,
                'data-name': d.name
            });

            var CC = PP.Cursor(cursor);
	    CC.LayerFrame(0, 0);

	    if(typeof d.brushdata == "object"){
		    CC.Color(d.brushdata.c);
		    CC.Size(d.brushdata.s);

		    CC.Position(d.brushdata.x, d.brushdata.y);
		    CC.LayerFrame(d.brushdata.l, d.brushdata.f);
		    CC.Drawing(d.brushdata.d);
	    }

            $('#mouse-pool').append(cursor);
        }

        PP.Update();
    });

    PP.socket.on('rs', function(d) {
	// data
	if(typeof d.admin != "undefined") {

	    var c = PP.Cursor('#painter-' + d.admin);
	    if(c == null) {
		return console.error("Admin cursor doesn't exist!")
	    }
	    pthis.Admin(c);
	    $('body').toggleClass('is-admin', c.IsMe());
	}
	// TODO password info thing
	//rthis.Private(d.password);
	PP.Update();
    });
    PP.socket.on('lf', function(d) {

	var l = parseInt(d.l),
	    f = parseInt(d.f);

	var c = PP.Cursor('#painter' + d.id);
	if(c === null) return console.error("Cursor doesn't exist.");
	if(pthis.server_roundtrip && c.IsMe()) {
	    ParupaintCanvas.Focus(l, f);
	    PP.ui.UpdateHeavy();
	}
	c.LayerFrame(l, f);
    });
    PP.socket.on('draw', function(d) {
	var x = d.xo, // net original x
	    y = d.yo, // net original y
	    l = d.l, // net l
	    f = d.f, // net f

	    // required
	    xx = d.x, // net x
	    yy = d.y, // net y
	    ww = d.w, // net width
	    pp = d.p, // net pressure
	    cc = d.c, // net color
	    dd = d.d; // net drawing

	var ss = ww*pp;
	if(typeof ss != "number") return; // something went awfully wrong.


	if(typeof d.id != "undefined") {
	    //someone.
	    var c = PP.Cursor('#painter-' + d.id);
	    if(c === null) {
		return console.error("Cursor doesn't exist.");
	    }
	    if(!pthis.server_roundtrip && c.IsMe()) {
		// ignore this is this is me and roundtrip is off
		return false;
	    }
	    var od = ParupaintCanvas.Init(),
		nd = [
		    $('.canvas-workarea').width(),
		    $('.canvas-workarea').height()
		];

	    // get saved position
	    var ppc = c.CanvasPosition(),
		lf = c.LayerFrame();


	    if(typeof xx != "undefined" &&
		typeof yy != "undefined") {
		c.Position((xx / od[0]) * nd[0], (yy / od[1]) * nd[1]);
		c.CanvasPosition(xx, yy);
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
		x: xx,
		y: yy
	    });


	    if(typeof dd != "undefined" &&
		dd != c.Drawing()) {
		if(dd) {
		    //starting to draw
		    ppc[0] = xx, ppc[1] = yy;
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
		    ppc[0], ppc[1], xx, yy, cc, ss);
	    }
	} else {
	    var canvas = $('.canvas-pool canvas').
	    filter('[data-layer=' + l + '][data-frame=' + f + ']');
	    ParupaintCanvas.DrawLine(canvas,
		x, y, xx, yy, cc, ss);
	}

    });



    // events

    $('form.password-input').unbind().submit(function(e) {
        var p = $(this).children('.password-change').val();
        if(pthis.Admin()) {
            PP.Emit('rs', {
                password: p
            });
        }
        return false;
    })
    $('form.dimension-input').submit(function() {
        var w = parseInt($(this).children('.dimension-w-input').val()),
            h = parseInt($(this).children('.dimension-h-input').val());

        if(PP.IsConnected()) {
            PP.Emit('r', {
                width: w,
                height: h
            });
        } else {
            ParupaintCanvas.Init(w, h);
        }
        return false;
    });
    $('input.con-status').change(function(e) {
        var c = $(e.target).is(':checked');
        if(PP.IsConnected()) {
            manual_disconnect = true;
            PP.socket.Close();
        } else {
            PP.socket.Connect();
        }
    })
    $('#tablet-input-id').change(function(e) {
        var c = $(e.target).is(':checked');
        var setup = function(){
            console.log("setting up tablet.")
            if(SetTablet(c)){
                ParupaintStorage.SetStorageKey({
                    'tablet': c
                });
            }
        }

        if(ParupaintChrome.IsChrome()){
            var hh = {permissions: ['hid']};
            chrome.permissions.contains(hh, function(e){
                if(!e){
                    chrome.permissions.request(hh, function(g){
                        if(g) {
                            setup();
                        }
                    });
                } else {
                    setup();
                }
            })
        } else {
            setup();
        }
    })


    $('.setting-bottom-row > div[type="button"]').click(function(ee) {
        var e = $(ee.target)
        if(e.is('.setting-down-img')) {
            ParupaintCanvas.Download();
        } else if(e.is('.setting-save-img')) {
            PP.room.SaveCanvas(function() {
                console.info('Saved canvas.')
            });
        } else if(e.is('.setting-reload-img')) {
            PP.Emit('img');
        }
    });


    this.key_eraser = 3;
    this.picking_color = false;
    this.pick_canvas = null;
    this.autoswitch = false;
    this.mouseTimer = null;
    this.server_roundtrip = false;

    var pthis = this;

    $('#mouse-pool').unbind().sevent(function(e, data) {

        if(e == 'mousemove' && data.target.tagName == 'CANVAS') {

            // original dimensions and new (zoomed) dimensions
            var ow = $('canvas.focused').get(0).width,
                oh = $('canvas.focused').get(0).height,
                nw = $('.canvas-workarea').width(),
                nh = $('.canvas-workarea').height();

            // brush information
            var mx = (data.x / nw) * ow,
                my = (data.y / nh) * oh,
                s = PP.brush.Size(),
                c = PP.brush.Color();

            if(PP.ui.movingCanvas || (data.button == PP.ui.key_move)) {
                var b = $(window);
                b.scrollLeft(b.scrollLeft() - data.sx);
                b.scrollTop(b.scrollTop() - data.sy);
                return true;

            } else if(pthis.picking_color) {

                if(pthis.pick_canvas.length) {

                    var px = pthis.pick_canvas.get(0).
                    getContext('2d').getImageData(mx, my, 1, 1).data;

                    var r = ('00' + px[0].toString(16)).slice(-2),
                        g = ('00' + px[1].toString(16)).slice(-2),
                        b = ('00' + px[2].toString(16)).slice(-2),
                        a = ('00' + px[3].toString(16)).slice(-2);
                    var hex = "#" + ("00000000" + (r + g + b + a)).slice(-8);

                    if(hex != PP.brush.Color()) {

                        var hsl = new ParupaintColor(px[0], px[1], px[2], px[3]).ToHsl();
                        PP.color.Hsl(hsl.h, hsl.s, hsl.l, hsl.a);

                        PP.brush.Color(hex, PP.Cursor()).UpdateLocal(PP);

                        PP.Cursor().cursor.css('background-color',
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

            var cc = PP.Cursor();
            var cursor = cc.cursor;
            if(cursor.length) {
                // move the cursor.

                var left = parseInt(cursor.css('left')),
                    top = parseInt(cursor.css('top'));

                var dx = (data.x - left),
                    dy = (data.y - top);

                var dist = Math.sqrt(dx * dx + dy * dy);

                // use a higher distance when not drawing to skip updating more
                if(pthis.picking_color || dist > (drawing ? 2 : 15)) {

                    if(!drawing && !pthis.picking_color) {
                        PP.Emit('draw', {
                            x: mx,
                            y: my,
                            s: s,
                            c: c,
                            d: false
                        });
                    }

                    if(!pthis.server_roundtrip) {
		        cc.Position(data.x, data.y);
		        cc.CanvasPosition(mx, my);
                    }
                    if(!pthis.server_roundtrip) {
                        if(pthis.mouse_timer) clearTimeout(pthis.mouse_timer);
                        pthis.mouse_timer = setTimeout(function() {
                            cc.Position(data.x, data.y);
                            cc.CanvasPosition(mx, my);
                        }, 800);
                    }
                }
            }

            // tablet hokus pokus
            var tabletPressure = null; {

                var tabletSwitch = function(e) {
                    PP.brush.Brush(e).UpdateLocal(PP);

                    var cc = PP.Cursor();
                    PP.Emit('draw', {
                        x: cc.CanvasPosition()[0],
                        y: cc.CanvasPosition()[1],
                        s: PP.brush.Size(),
                        c: PP.brush.Color(),
                        d: false
                    });
                    //TODO put d as cc.Drawing()?
                };

                var eraser = PP.brush.current;
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
                if(eraser != PP.brush.current &&
                    !pthis.autoswitch) {
                    tabletSwitch(eraser);
                } else if (eraser == PP.brush.current &&
                    pthis.autoswitch){
                        // turn it off if we match
                        pthis.autoswitch = false;
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
                    PP.Emit('draw', {
                        x: mx,
                        y: my,
                        w: s,
			p: 1.0,
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
                var nb = PP.brush.OppositeBrush();
                pthis.autoswitch = true;

                PP.brush.Brush(nb).UpdateLocal(PP);

		var c = PP.Cursor();
                PP.Emit('draw', {
		    x: c.CanvasPosition()[0],
		    y: c.CanvasPosition()[1],
                    s: PP.brush.Size(),
                    c: PP.brush.Color(),
                    d: false
                })

            }
        } else if(e == 'mouseup') {
            var c = PP.Cursor();
            if(c != null) {
                c.cursor.children('.cursor-pressure-size').removeAttr('style');
                // clear pressure sensitivity marker
            }
        } else if(e == 'mouseout') {
            var c = PP.Cursor();
            PP.Emit('draw', {
                x: c.CanvasPosition()[0],
                y: c.CanvasPosition()[1],
                s: PP.brush.Size(),
                c: PP.brush.Color(),
                d: false
            })

        } else if(e == 'mousewheel') {
            if(!(PP.ui.zoomingCanvas || PP.ui.movingCanvas)) {
                var a = data.scroll > 0 ? 2 : 0.5;

                if(true) {
                    var s = PP.brush.Size() * a;
                    if(s < 1) s = 1;
                    if(s > 256) s = 256;

                    PP.brush.
                    Size(s, PP.Cursor()).UpdateLocal(PP);

                    var cc = PP.Cursor();
                    PP.Emit('draw', {
                        x: cc.CanvasPosition()[0],
                        y: cc.CanvasPosition()[1],
                        s: s,
                        c: PP.brush.Color(),
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

                        PP.Cursor().cursor.removeClass('pick-color');
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
                        PP.brush.Size(sizes[k]).UpdateLocal(PP);

                        var cc = PP.Cursor();
                        PP.Emit('draw', {
                            x: cc.CanvasPosition()[0],
                            y: cc.CanvasPosition()[1],
                            s: PP.brush.Size(),
                            c: PP.brush.Color(),
                            d: false
                        });

                        return false;
                    }
                case 82: // r
                    {
                        if(data.ctrl) {
                            // pick color from all canvases
                        } else if(data.shift) {
                            PP.Emit('img');
                        } else {
                            if(!pthis.picking_color) {
                                pthis.picking_color = true;
                                PP.Cursor().cursor.addClass('pick-color');
                                pthis.pick_canvas = $('canvas.focused');
                            }
                        }
                        break;
                    }
                case 69: // e
                    {
                        var nb = PP.brush.OppositeBrush();
                        pthis.autoswitch = true;

                        PP.brush.Brush(nb).UpdateLocal(PP);

                        var cc = PP.Cursor();
                        PP.Emit('draw', {
                            x: cc.CanvasPosition()[0],
                            y: cc.CanvasPosition()[1],
                            s: PP.brush.Size(),
                            c: PP.brush.Color(),
                            d: false
                        });
                        break;
                    }
            }
        }
    }).bind('contextmenu', function(e) {
        return false;
    })


});

jQuery.fn.extend({
    sevent: function(callback) {
        return this.each(function(k, e) {
            var mb = 0,
                tmouse = {};

            $(e).unbind().bind('mousemove mousedown', function(e) {
                if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
                if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
                if(callback) {
                    if(tmouse.oldx === undefined) tmouse.oldx = e.offsetX;
                    if(tmouse.oldy === undefined) tmouse.oldy = e.offsetY;
                    if(tmouse.oldsx === undefined) tmouse.oldsx = e.clientX;
                    if(tmouse.oldsy === undefined) tmouse.oldsy = e.clientY;

                    var cx = (e.offsetX - tmouse.oldx);
                    var cy = (e.offsetY - tmouse.oldy);
                    tmouse.oldx = e.offsetX;
                    tmouse.oldy = e.offsetY;

                    var csx = (e.clientX - tmouse.oldsx);
                    var csy = (e.clientY - tmouse.oldsy);
                    tmouse.oldsx = e.clientX;
                    tmouse.oldsy = e.clientY;

                    return callback('mousemove', {
                        button: mb,
                        x: e.offsetX + document.documentElement.scrollLeft,
                        y: e.offsetY + document.documentElement.scrollTop,

                        xpage: e.pageX,
                        ypage: e.pageY,
                        cx: cx,
                        cy: cy,
                        sx: csx,
                        sy: csy,
                        xclient: e.clientX,
                        yclient: e.clientY,
                        target: e.target,
                        mozPressure: e.mozPressure
                    });

                }
            }).mouseenter(function(e) {
                if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
                if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top

                if(callback) {
                    if(tmouse.oldx === undefined) tmouse.oldx = e.offsetX;
                    if(tmouse.oldy === undefined) tmouse.oldy = e.offsetY;
                    mb = (e.buttons != undefined ? e.buttons : e.which)
                    return callback('mouseenter', {
                        button: (e.which || e.button),
                        x: e.offsetX,
                        y: e.offsetY,
                        xpage: e.pageX,
                        ypage: e.pageY,
                        xclient: e.clientX,
                        yclient: e.clientY,
                        target: e.target
                    });
                }
            }).mouseout(function(e) {
                if(callback) {
                    tmouse.oldx = undefined;
                    tmouse.oldy = undefined;
                    return callback('mouseout', {
                        button: (e.which || e.button),
                        x: e.offsetX,
                        y: e.offsetY,
                        xpage: e.pageX,
                        ypage: e.pageY,
                        xclient: e.clientX,
                        yclient: e.clientY,
                        target: e.target
                    });
                }
            }).mousedown(function(e) {
                if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
                if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
                if(callback) {
                    tmouse.oldx = e.offsetX;
                    tmouse.oldy = e.offsetY;
                    mb = e.which
                    return callback('mousedown', {
                        button: e.which,
                        x: e.offsetX,
                        y: e.offsetY,
                        xpage: e.pageX,
                        ypage: e.pageY,
                        xclient: e.clientX,
                        yclient: e.clientY,
                        target: e.target
                    });
                }
            }).mouseup(function(e) {
                if(e.offsetX == undefined) e.offsetX = e.clientX - $(e.target).offset().left
                if(e.offsetY == undefined) e.offsetY = e.clientY - $(e.target).offset().top
                if(callback) {
                    tmouse.oldx = e.offsetX;
                    tmouse.oldy = e.offsetY;
                    mb = 0
                    return callback('mouseup', {
                        button: e.which,
                        x: e.offsetX,
                        y: e.offsetY,
                        xpage: e.pageX,
                        ypage: e.pageY,
                        xclient: e.clientX,
                        yclient: e.clientY,
                        target: e.target
                    });
                }
            }).keydown(function(e) {
                if(callback) {
                    return callback('keydown', {
                        key: e.keyCode,
                        shift: e.shiftKey,
                        ctrl: e.ctrlKey
                    });
                }
            }).keyup(function(e) {
                if(callback) {
                    return callback('keyup', {
                        key: e.keyCode,
                        shift: e.shiftKey,
                        ctrl: e.ctrlKey
                    });
                }
            }).bind('mousewheel DOMMouseScroll', function(e) {

                var wd = e.originalEvent.wheelDelta / 100;
                var ed = e.originalEvent.detail * -1;
                if(wd || ed) return callback('mousewheel', {
                    scroll: wd || ed,
                    target: e.target
                })

            }).on('paste', function(e) {
                if(callback) {
                    return callback('paste', {
                        clipdata: (e.originalEvent || e).clipboardData
                    })
                }
            })

        })
    }
})

/*

if(typeof chrome != "undefined" && typeof chrome.permissions != "undefined"){
	chrome.permissions.contains({permissions:['hid']}, function(e){
		if(e){
			$('input.set-tablet').addClass('enabled')
		}
	})
}

*/
