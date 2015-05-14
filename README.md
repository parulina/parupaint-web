```
// [default] list of tablets.
// [] vendorId: 	required. 1386 is wacom, 5935 is Waltop/Trust.
// [] productId: 	required.
// ['??'] name: 	the name of the tablet. it's a good thing to have it...
// [2000] w: 		the width of the tablet in units reported by hid.receive.
// [2000] h: 		see above, but height.
// [1024] p: 		maximum pressure hid.receive will report.
```

this is under construction.

# parupaint-web
this is the web app interface to parupaint.
it has support for wacom's tablet plugin.
it also works as a chrome app with (attempted) tablet support through HID!

my code is a mess though. feel free to clean it up or something...

## controls
###brush controls
* <kbd>1</kbd> to <kbd>5</kbd> or <kbd>Mousewheel</kbd> to change brush size.
or, <kbd>Shift</kbd>+<kbd>Space</kbd> and move the mouse up and down. you might have to be violent with it.
* <kbd>E</kbd> to toggle between eraser and brush.
* <kbd>R</kbd> to pick color.

###canvas controls
* <kbd>Space</kbd> to move the canvas around.
* <kbd>Ctrl</kbd>+<kbd>Space</kbd> or <kbd>Space</kbd> + <kbd>Mousewheel</kbd> to zoom.
* <kbd>Tab</kbd> to show infopanels, tap twice to enter a chat message.
* <kbd>Shift</kbd>+<kbd>Tab</kbd> to hide infopanels.

## todo
- move Brushglass to pp_main.js
- extend layer/frame
- make hid work
