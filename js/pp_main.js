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
                        }).data({
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
        }
        // either:
        // set current room, which will toggle states and such
        // get current room name

    this.Room = function(room_name) {
        this.ResetBody();
        $('body').addClass('loading');
        this.room = ParupaintRoom(this); // clean up and reset

        if(typeof room_name == "string") {
            console.warn('Creating Parupaint Room [' + room_name + '].');

            $('body').removeClass('loading');
            this.room = new ParupaintRoom(this, room_name);
        }
    }

    this.ResetBody = function() {
        window.location.hash = '';
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

        if(this.room) {
            var d = ParupaintCanvas.Init(); // get dimensions
            var ll = [
                '[' + this.room.name + ']',
                this.painters.length + ' artists',
                '[' + d[0] + '×' + d[1] + ']'
            ];

            document.title = ll.join(' ');

        }
    }

}



var PP = null;
$(function() {

    PP = new Parupaint();

    // TODO name set? and stuff
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

    // ROOM
    var current_hash = document.location.hash;

    $(window).on('hashchange', function(){
        var room_name = document.location.hash.replace(/#/, '');
        if(document.location.hash === current_hash){
            PP.default_room = room_name;
            return;
        }
        current_hash = document.location.hash = document.location.hash;
        console.info('Switching to new room.', room_name);


        PP.Room(room_name);
        if(PP.IsConnected()){
            PP.socket.emit('leave');
            PP.socket.emit('join', {
                room: room_name
            });
        }

    })


    if(navigator.onLine) {
        PP.Connect();
    } else {
        PP.Room(PP.default_room);
        // if disconnected, just load the default room
        // in offline mode
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
        if(PP.room !== null) {
            PP.room.OnClose(e);
            if(!manual_disconnect){
                PP.ui.ConnectionError("socket closed.");
            }
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
                PP.Room(PP.default_room);
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
                PP.Room(PP.default_room);
                manual_disconnect = true;
                PP.ui.ClearLoading();
            } else {
                console.log(p)
                PP.Emit('join', {
                    room: d.name,
                    password: p
                });
            }
            return;
        }
        PP.Room(d.name);
        PP.ui.ClearLoading();

    });
    PP.socket.on('leave', function(d) {
        console.warn("Got websocket message to leave.");
        PP.Room(PP.default_room);
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


    // events

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
