"use strict";

console.info("Initializing parupaint-web, paru (c) 2014");

function Parupaint() {
    // socket, etc
    var private_var = true;
    this.public_var = false;


    this.server_url = 'sqnya.se:1108';
    this.default_room = 'sqnya';

    this.socket = null;
    this.room = null;
    this.myId = "";

    this.ui = new ParupaintInterface();


    this.Connect = function() {
        var pthis = this;
        this.socket =
            new golem.Connection('ws://' + this.server_url + '/main', false);
        this.socket.on('id', function(id) {
            console.info('You are (' + id + ').')
            pthis.myId = id;
        })

    }
    this.IsConnected = function() {
        return(typeof this.socket == "object" &&
            this.socket !== null &&
            this.socket.connected);
    }
    this.Emit = function(id, data) {
        if(this.IsConnected()) {
            this.socket.emit(id, data);
            return true;
        }
        return false;
    }
    this.SetConnectedEffect = function(onoff) {
        $('body').toggleClass('connected', onoff);
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

}



var PP = null;
$(function() {

    PP = new Parupaint();

    // TODO name set? and stuff
    ParupaintStorage.GetStorageKey('name', function(e) {
        var name = e.name;
        if(typeof name != "string") {
            name = prompt('Set name.');
            ParupaintStorage.SetStorageKey({
                name: name
            });
        }
        PP.Cursor().Name(name);
    })

    // TABLET SETUP
    // TODO chrome specific tablet set-up?
    ParupaintStorage.GetStorageKey('wacom_tablet', function(e) {
        if(e.wacom_tablet) {
            console.info("Setting up Wacom Tablet plug-in.");
            $('body').prepend(
                $('<object/>', {
                    id: 'wacomPlugin',
                    type: 'application/x-wacomtabletplugin'
                })
            );
        }
    });

    // ROOM
    if(document.location.hash) {
        console.log("Want to enter specific room.");

        var room_name = document.location.hash.replace(/#/, '');
        PP.default_room = room_name;
        //PP.Room(room_name);
    }


    // SOCKET SETUP
    // document title is already set
    if(navigator.onLine) {
        PP.Connect();
    } else {
        PP.Room(PP.default_room);
        // if disconnected, just load the default room
        // in offline mode
    }

    PP.socket.on('open', function(e) {
        console.log("Opened connection.");

        // FIXME this is for debug only.
        // i shall change the join to be automatically
        // in the server later.

        PP.socket.emit('join', {
            room: PP.default_room,
            name: PP.Cursor().Name()
        });



        PP.SetConnectedEffect(true);
        if(PP.room !== null) {
            PP.room.OnOpen(e);
        }
    });
    PP.socket.on('close', function(e) {
        PP.SetConnectedEffect(false);
        if(PP.room !== null) {
            PP.room.OnClose(e);
            console.log(PP.room);
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
            //TODO
        } else {

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


    $('.setting-bottom-row > div[type="button"]').click(function(ee) {
        var e = $(ee.target)
        if(e.is('.setting-down-img')) {
            ParupaintCanvas.Download();
        } else if(e.is('.setting-save-img')) {
            console.error('Local save not yet implemented.');
        } else if(e.is('.setting-reload-img')) {
            PP.Emit('img');
        }
    })
});

/*

if(typeof chrome != "undefined" && typeof chrome.permissions != "undefined"){
	chrome.permissions.contains({permissions:['hid']}, function(e){
		if(e){
			$('input.set-tablet').addClass('enabled')
		}
	})
}

*/
