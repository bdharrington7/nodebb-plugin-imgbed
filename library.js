//library.js

var Imgbed = {},
	XRegExp = require('xregexp').XRegExp,
	extensions = ['jpg', 'jpeg', 'gif', 'png'],
	regexStr = '<a href="(https?://[^\.]+\.[^\/]+\/[^\.]+\.(' + extensions.join('|') + '))">[^<]*<\/a>';


var regex = XRegExp(regexStr, 'gi');

Imgbed.parse = function(postContent, callback){
	if (postContent.match(regex)){
		postContent = postContent.replace(regex, '<img src="$1" class="mine">');
	}
	callback(null, postContent);
}


module.exports = Imgbed;
