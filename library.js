//library.js

var Imgbed = {},
	XRegExp = require('xregexp').XRegExp,
	extensions = ['jpg', 'jpeg', 'gif', 'png'],  // add capability for control panel here
	regexStr = '<a href="(https?://[^\.]+\.[^\/]+\/[^\.]+\.(' + extensions.join('|') + '))">[^<]*<\/a>';

// declare regex as global and case-insensitive
var regex = XRegExp(regexStr, 'gi');

Imgbed.parse = function(postContent, callback){
	if (postContent.match(regex)){
		postContent = postContent.replace(regex, '<img src="$1" alt="$1">');
	}
	callback(null, postContent);
}


module.exports = Imgbed;
