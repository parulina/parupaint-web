
var ParupaintSocket = function(addr){

    var seperator = " ",
    DefaultJSONProtocol = {
        unpack: function(data) {
            var name = data.split(seperator)[0];
            return [name, data.substring(name.length+1, data.length)];
        },
        unmarshal: function(data) {
            return JSON.parse(data);
        },
        marshalAndPack: function(name, data) {
            return name + seperator + JSON.stringify(data);
        }
    };
    // copypasta'd from golem.js

    this.protocol = DefaultJSONProtocol;
    this.address = addr;
    this.ws = null;
    this.callbacks = {};
    this.cc = function(c, d){
        if(this.callbacks[c]){
            if(typeof d != "undefined"){
                this.callbacks[c](d);
                return true;
            } else {
                return true;
            }
        }
        return false;
    };
    this.connected = false;

    this.Connect = function(){
        if(this.ws) this.ws.close();

        this.connected = false;
        this.ws = new WebSocket(this.address);
        //this.ws.binaryType = 'arraybuffer';

        this.ws.onclose = this.onClose.bind(this);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onerror = this.onError.bind(this);
        return this;
    };

    this.IsConnected = function(){
        return (this.connected);
    };

    this.onClose = function(e){
        this.connected = false;
        this.cc("close", e);
    }

    this.onMessage = function(e){
        var data = this.protocol.unpack(e.data);
        if(this.cc(data[0])){
            var obj = this.protocol.unmarshal(data[1]);
            this.cc(data[0], obj);
        }
    }
    this.onOpen = function(e){
        this.connected = true;
        this.cc('open', e);
    }
    this.onError = function(e){
        this.cc('error', e);
    }
    this.on = function(c, d){
        this.callbacks[c] = d;
        return this;
    }
    this.emit = function(c, d){
        this.ws.send(this.protocol.marshalAndPack(c, d));
    }
}
