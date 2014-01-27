//imgbed_main.js
// this will receive the progress of the download
var imgDebug = true;
socket.on ('event:imgbed.server.rcv', function (data){
	if (imgDebug){
		console.log("server receiving data");
		console.log (data);
	}
});
// this will recieve the final url
socket.on ('event:imgbed.server.rcv.end', function (data){
	if (imgDebug){
		console.log("Server done recieving data");
		console.log(data);
	}
	var id = '#' + data.id;
	var tag = $(id);
	tag.html('<img src="' + data.url + '" alt="' + data.alt + '" class="img-responsive">');
});