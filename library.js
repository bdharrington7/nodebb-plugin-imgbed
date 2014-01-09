//library.js

var Imgbed = {},
	XRegExp = require('xregexp').XRegExp,
	extensions = ['.gif', '.GIF'];

var regex = XRegExp('(<img src="|<a href=")?(https?://[^">]*\.(jpe?g|png))">.+<\/a>', 'i');

Imgbed.parse = function(postContent, callback){
	var matches = postContent.match(regex);
	if (matches){
		// make the replacement
		console.log(" *** match made! *** ");
		console.log(matches);
		postContent = postContent.replace(matches[0], '<img src="' +  matches[2] + '" class="mine">');
	}
	else {
		console.log("*** no match ***");
	}
	callback(null, postContent);
}


module.exports = Imgbed;
