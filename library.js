//library.js

// stuff for the admin panel
var		fs = require('fs'),
		path = require('path'),
		templates = module.parent.require('../public/src/templates.js');

var contants = Object.freeze({
	"name": "Imgbed Admin Page",
	"admin": {
		"route": "/imgbed",
		"icon": "icon-heart" // TODO: change this to something that makes more sense
	}
});

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

Imgbed.registerPlugin = function(custom_header, callback){
	custom_header.plugins.push({
		"route": contants.admin.route,
		"icon": contants.admin.icon,
		"name": contants.name
	});
}

Imgbed.addRoute = function(custom_routes, callback){
	fs.readFile(path.resolve(__dirname, "./public/templates/admin.tpl"), function (err, template){
		custom_routes.routes.push({
			"route": contants.admin.route,
			"method": "get",
			"options": function (req, res, callback) {
				callback({
					req: req,
					res: res,
					route: constants.admin.route,
					name: constants.name,
					content: template
				});
			}
		});

		callback(null, custom_routes);
	});
}

module.exports = Imgbed;
