"use strict";

var ParupaintStorage = new function() {
    this.GetStorageKey = function(key, callback) {
        if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined') {
            return chrome.storage.local.get(key, function(d){
                if(typeof d[key] == 'object') d = d[key];
                if(typeof callback == "function") callback(d);
            })
        } else {
            var a = {};
            if(key != null){
                a = localStorage.getItem(key);
            }

            if(typeof callback == 'function') {
                return callback(a);
            }
            return a;
        }
    };
    this.SetStorageKey = function(key, callback) {
        if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined') {
            return chrome.storage.local.set(key, callback)
        } else {
            for(var i in key) {
                if(typeof key[i] == "object"){
                    key[i] = JSON.stringify(key[i]);
                }
                localStorage.setItem(i, key[i]);
            }
            if(typeof callback == 'function') return callback();
            return true;
        }
    };
    this.ClearStorage = function() {
        if(typeof chrome != 'undefined' && typeof chrome.storage != 'undefined') {
            chrome.storage.local.clear()
        } else {
            localStorage.clear();
        }
    };
    return this;
};
