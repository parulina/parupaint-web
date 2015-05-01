"use strict";

// Chrome specific code.

if(typeof chrome != "undefined" &&
    true) { // check if it's a chromeapp, etc
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
    }
