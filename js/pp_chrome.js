"use strict";

// Chrome specific code.

var ParupaintChrome = new function(){

    var tablet_devices = [];

    this.BindKeys = function(){
        $(document).keydown(function(e) {
            switch(e.keyCode) {
                case 116:
                    {
                        return chrome.runtime.reload();
                    }
                case 123:
                    {
                        var fperm = {
                            permissions: ['alwaysOnTopWindows']
                        }
                        chrome.permissions.contains(fperm, function(e) {
                            if(e) {
                                if(chrome.app.window.current().isAlwaysOnTop()) {
                                    return chrome.app.window.current().setAlwaysOnTop(false)
                                }
                                return chrome.app.window.current().setAlwaysOnTop(true)

                            } else {
                                chrome.permissions.request(fperm)
                            }
                        })
                        break;
                    }
                case 13:
                    {
                        if(e.altKey) {
                            if(chrome.app.window.current().isFullscreen()) {
                                return chrome.app.window.current().restore()
                            }
                            return chrome.app.window.current().fullscreen()

                        }
                        break;
                    }
            }
        });
    };
    this.Tablet = function(d){

        if(d){
            if(!tablet_devices.length) return;
            chrome.permissions.contains({permissions:['hid']}, function(e){
                if(e){
                    chrome.hid.getDevices({filters: tablet_devices}, function(dev){
                        console.log('---> ',dev, tablet_devices.length)
                    });
                }
            })
        }
    }
    this.IsChrome = function(){
        return (typeof chrome != "undefined" && typeof chrome.runtime.getBackgroundPage == "function");
    }

    if(this.IsChrome()){

        console.info("It's a chrome app.");
        this.BindKeys();

        var manifest =  chrome.runtime.getManifest(),
            devs =      manifest.permissions.slice(-1)[0].usbDevices;

        for(var pid in devs){
            tablet_devices.push({
                vendorId: devs[pid].vendorId,
                productId: devs[pid].productId,
            })
        }
        // get ids
    }
    // initialize tablet...

}
