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
    this.Emit = function(id, data){
        if(this.IsConnected()){
            this.socket.emit(id, data);
            return true;
        }
        return false;
    }
    this.SetConnectedEffect = function(onoff) {
        $('body').toggleClass('connected', onoff);
    }

    this.Id = function(i) {
        if(typeof i == "string") this.myId = i;
        return this.myId;
    }


    //Cursor funcs
    this.Cursor = function(thing) {
        var dd = this.Id();
        var cur = function(c) {

            this.cursor = null;
            this.Name = function(n) {
                if(typeof this.cursor != "object") return "";
                if(typeof n == "string") this.cursor.data('name', n).attr('name', n)
                else return this.cursor.data('name');
            };
            this.Position = function(x, y) {
                if(typeof this.cursor != "object") return [0, 0];
                if(typeof x == "number" &&
                    typeof y == "number") this.cursor.css({
                    left: x,
                    top: y,
                });
                else return [this.cursor.css('left'), this.cursor.css('top')];
            };
            this.Size = function(s) {
                if(typeof this.cursor != "object") return 0;
                if(typeof s == "number") this.cursor.css({
                    width: s,
                    height: s,
                });
                else return this.cursor.css('width');
            };
            this.Id = function() {
                if(typeof this.cursor != "object") return "";
                if(!this.cursor.hasClass('cursor-self')) return this.cursor.attr('id');
                else return this.myId;
            }
            if(typeof c == "string") this.cursor = $('#' + c);
            if(typeof c == "undefined") this.cursor = $('.canvas-cursor.cursor-self');
            if(typeof c == "object") this.cursor = c;
        }
        var cc = new cur();
        return cc;
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
            'is-private is-admin loading disconnected'
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
        console.log("Opened connection.")

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
        console.log("Closed connection.", e, e.code)
        PP.SetConnectedEffect(false);
        if(PP.room !== null) {
            PP.room.OnClose(e);
        }

        //TODO add chat message
        //TODO disconnected class for a few seconds, fade out
    });
    PP.socket.on('join', function(d) {
        //console.warn("Server wants us to join [" + d.name + "]");
        PP.Room(d.name)
            //TODO PP.Room(d.name)
    });
    PP.socket.on('leave', function(d) {
        console.warn("Got websocket message to leave.");
        PP.Room();
        $('body').addClass('disconnected');
    });
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
