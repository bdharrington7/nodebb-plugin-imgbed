//library.js

// stuff for the admin panel
var		fs = require('fs'),
		path = require('path'),
		mkdirp = require('mkdirp'),
		templates = module.parent.require('../public/src/templates.js');

var constants = Object.freeze({
	"name": "Imgbed",
	"admin": {
		"route": "/imgbed",
		"icon": "fa-th-large"
	}
});

var uploadHotlinks = meta.config['nodebb-plugin-imgbed:options:upload'],
	userExt = meta.config['nodebb-plugin-imgbed:options:extensions'],
	uploadUrl = path.resolve(__dirname, "uploads/imgbed/"); // __dirname points to the plugin root


fs.exists(uploadUrl, function(exists){
	if(!exists){
		console.log(constants.name + ": Path doesn't exist, creating...");
		mkdirp(uploadUrl, function(err){
			if (err){
				console.log(constants.name + ": Error creating directory: " + err);
			}
			else {
				console.log(constants.name + ": Successfully created upload directory!");
			}
		});
		// mkdirp.sync(uploadUrl);
		console.log(constants.name + ": Done!");
	}
	else {
		console.log(constants.name + ": Path exists");
	}
});

var Imgbed = {},
	XRegExp = require('xregexp').XRegExp,
	extensions = userExt ? userExt.split(',') : ['jpg', 'jpeg', 'gif', 'png'],  // add capability for control panel here
	regexStr = '<a href="(?<url>https?://[^\.]+\.[^\/]+\/[^\.]+\.(' + extensions.join('|') + '))">[^<]*<\/a>';

// declare regex as global and case-insensitive
var regex = XRegExp(regexStr, 'gi');

var dlUrl = function(rawUrl){ //convert the raw url to an upload url on this server
	if (uploadHotlinks){
		rawUrl = rawUrl.replace(XRegExp('[^A-Za-z_0-9.-]', 'gi'), '_');
		return uploadPath + rawUrl;
	}
	return rawUrl;
}

Imgbed.parse = function(postContent, callback){
	if (postContent.match(regex)){
		if (uploadHotlinks){
			// check if resource is downloaded already, download if not there
			if (!fileExists) {  // download

			}

			postContent = XRegExp.replace(postContent, regex, function(match){
				return match.replace(match.url, dlUrl(match.url));
			});

		}
		else {
			postContent = postContent.replace(regex, '<img src="${url}" alt="${url}">');
		}
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
