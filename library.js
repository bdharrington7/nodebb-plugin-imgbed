//library.js

// stuff for the admin panel
var		fs = require('fs'),
		path = require('path'),
		templates = module.parent.require('../public/src/templates.js');

var constants = Object.freeze({
	"name": "Imgbed",
	"admin": {
		"route": "/imgbed",
		"icon": "fa-th-large"
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
		"route": constants.admin.route,
		"icon": constants.admin.icon,
		"name": constants.name
	});

	return custom_header;
}

Imgbed.addRoute = function(custom_routes, callback){
	fs.readFile(path.resolve(__dirname, "./public/templates/admin.tpl"), function (err, template){
		custom_routes.routes.push({
			"route": constants.admin.route,
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
