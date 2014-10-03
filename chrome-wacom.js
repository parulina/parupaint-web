//script for wacom


var size = 16;
/*
chrome.usb.findDevices({"vendorId": 5935, "productId": 52}, function(con){
	if(!con) return console.log('Device not found.');
	*/

/*
chrome.hid.getDevices({ "vendorId": 5935, "productId": 52}, function(dev) {
	if(!dev || !dev.length) return console.log('device not found.');	
	
	console.log('device ['+dev[0].deviceId+'] opened.');
    console.log(dev[0]);
	
    chrome.hid.connect(dev[0].deviceId, function(con){
       if(!con) console.log('Failed connection.');
        console.log('Connected ('+con.connectionId+').');
        connection = con.connectionId;
        
        
//        setInterval(function(){
            chrome.hid.receive(con.connectionId, function(rid, data){
                if(data){
                    var a = new Int16Array(data);
                    console.log(':' + a);
                    document.getElementById('info').innerHTML = 
                            ("x: " + a[1] + "  y: " + a[2] + "  p: " + a[3] + "     " + a[0].toString(16));
                }
            });
//        }, 0);
    });
});
*/