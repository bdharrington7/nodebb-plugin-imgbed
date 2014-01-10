//library.js

var Imgbed = {},
	XRegExp = require('xregexp').XRegExp,
	extensions = ['jpg', 'jpeg', 'gif', 'png'],
	regexStr = '(<img src="|<a href=")?(https?://[^">]*\.(' + extensions.join('|') + '))">.+<\/a>';


var regex = XRegExp(regexStr, 'gi');

Imgbed.parse = function(postContent, callback){
	if (postContent.match(regex)){
		postContent = postContent.replace(regex, '<img src="$2" class="mine">');
	}
	callback(null, postContent);
}


module.exports = Imgbed;
