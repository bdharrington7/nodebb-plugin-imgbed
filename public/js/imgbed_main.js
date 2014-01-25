//imgbed_main.js

socket.on ('event:imgbed.server.rcv', function (data){
	console.log("server receiving data");
	console.log (data);
});
socket.on ('event:imgbed.server.rcv.end', function (data){
	console.log("Server done recieving data");
	console.log(data);
});