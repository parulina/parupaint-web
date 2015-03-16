# parupaint-web
this is the web app interface to parupaint.
it has support for wacom's tablet plugin.
it also works as a chrome app with (attempted) tablet support through HID!

my code is a mess though. feel free to clean it up or something...

## controls
###brush controls
* <kbd>1</kbd> to <kbd>5</kbd> or <kbd>Space</kbd> + <kbd>Mousewheel</kbd> to change brush size.
or, <kbd>Shift</kbd>+<kbd>Space</kbd> and move the mouse up and down. you might have to be violent with it.
* <kbd>E</kbd> to toggle between eraser and brush.
* <kbd>R</kbd> to pick color.
###canvas controls
* <kbd>Space</kbd> to move the canvas around.
* <kbd>Ctrl</kbd>+<kbd>Space</kbd> or <kbd>Mousewheel</kbd> to zoom.
* <kbd>Tab</kbd> to show infopanels, tap twice to enter a chat message.
* <kbd>Shift</kbd>+<kbd>Tab</kbd> to hide infopanels.

## code structure
- `pp_init.js` is the starting point of the app. it checks whether it's a chrome app, in which case it'll try and connect a tablet. it then calls initParupaint, which is in..
- `pp_main.js`. it contains:
	- connectSocket, which connects.. the socket
	- initParupaint(room, opt), which, if room is a string, creates a canvas room with that name. otherwise it creates the lobby
- initParupaint then creates an onRoom object (`pp_canvas_mainscript.js`), which makes an object containing properties and objects related to rooms.
	- it sets up network (`pp_canvas_network.js`)
	- it sets up key- and mouse-bindings (`pp_canvas_keybinds.js`)
	- it uses chat functions (`pp_canvas_chat.js`)
	- it uses color function for the color wheel (`pp_canvas_color.js`)
- `pp_canvas_functions.js` contains handy functions for handling the actual canvas.
- `pp_functions.js` contains some functions to simplify the javascript.
- `index.html` should be pretty self-explanatory.

all-in-all, i'd like the code to not be any more split up than it needs to be.

## todo
- only two brushes right now, add more in the future perhaps?
- clean up and possibly organize code
- proper error checking in code (which i'm sloppy with)
- layer/frame sync with server

