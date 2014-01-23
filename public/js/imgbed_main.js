//imgbed_main.js
//var socket = io.connect('http:')
//alert("main.js loaded for " + location.host);
console.log ("Client connecting to " + location.hostname + ":4568");
var mySock = io.connect(location.hostname + ":4568");
mySock.emit('imgbed.client', { ip: 12345 });
mySock.on ('imgbed.server.rcv', function (data){
	console.log("server receiving data");
	console.log (data);
})
mySock.on ('imgbed.server.rcv.end', function (data){
	console.log("Server done recieving data");
	console.log(data);
})