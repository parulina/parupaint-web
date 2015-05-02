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

    this.socket = new ParupaintSocket('ws://' + this.server_url + '/main').
    on('id', function(id) {
        console.info('You are (' + id + ').');
        this.myId = id;
    });

    this.ui = new ParupaintInterface();
    this.chat = new ParupaintChat();

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
            var dd = this.Id();

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
                    } else return this.myId;
                };
                this.IsMe = function() {
                    return(this.Id() == dd);
                };
                return this;
            };

            if(typeof thing == "string") {
                var d = thing.replace(/#/, "");
                if(d == dd) {
                    cur.cursor = $('.canvas-cursor.cursor-self');
                } else {
                    cur.cursor = $('#' + d);
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
        $('#wacomPlugin').remove();
        PP.ui.SetTabletInput(d);
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
    ParupaintStorage.GetStorageKey('wacom_tablet', function(d) {
        if(d) {
            console.info("Setting up Wacom Tablet plug-in.");
            SetTablet(d);
        }
    });

    // ROOM
    if(document.location.hash) {
        console.log("Want to enter specific room.");

        var room_name = document.location.hash.replace(/#/, '');
        PP.default_room = room_name;
        //PP.Room(room_name);
    }


    if(navigator.onLine) {
        PP.Connect();
    } else {
        PP.Room(PP.default_room);
        // if disconnected, just load the default room
        // in offline mode
    }

    var manual_disconnect = false;
    // ONE-TIME SOCKET SETUP
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
        if(!d.success) {
            //todo show error
            PP.ui.ConnectionError('invalid password.');
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
            msg: d.msg,
            name: d.name,
            time: d.time
        });
    });

    PP.socket.on('peer', function(d) {

        console.info('Peer connected [' + d.id + '] (' + d.name + ').');
        var id = $('#' + d.id);
        if(d.disconnect && id.length) {
            id.remove();
        } else if(!d.disconnect) {
            var cursor = $('<div/>', {
                class: 'canvas-cursor',
                id: d.id,
                'data-name': d.name
            });

            var CC = PP.Cursor(cursor);

            CC.Size(d.brushdata.Size);
            CC.Position(d.brushdata.X, d.brushdata.Y);
            CC.LayerFrame(d.brushdata.Layer, d.brushdata.Frame);

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
    $('input.private-status').change(function(e) {
        var c = $(e.target).is(':checked');
        if(pthis.Admin()) {
            PP.Emit('rs', {
                private: c
            });
        }
    })
    $('#tablet-input-id').change(function(e) {
        var c = $(e.target).is(':checked');
        ParupaintStorage.SetStorageKey({
            'wacom_tablet': c
        });
        SetTablet(c);
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
