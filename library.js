//library.js

// stuff for the admin panel
var		fs = require('fs'),
		path = require('path'),
		mkdirp = require('mkdirp'),
		nconf = module.parent.require('nconf'),
		templates = module.parent.require('../public/src/templates.js');

var constants = Object.freeze({
	"name": "Imgbed",
	"admin": {
		"route": "/imgbed/",
		"icon": "fa-th-large"
	}
});

var uploadHotlinks = meta.config['nodebb-plugin-imgbed:options:upload'],
	userExt = meta.config['nodebb-plugin-imgbed:options:extensions'],
	uploadUrl = path.join(nconf.get('base_dir'), nconf.get('upload_path'), constants.admin.route), // for creating the dir
	relativeUrl = "/uploads" + constants.admin.route;


fs.exists(uploadUrl, function(exists){
	if(!exists){
		console.log(constants.name + ": Path doesn't exist, creating " + uploadUrl);
		mkdirp(uploadUrl, function(err){
			if (err){
				console.log(constants.name + ": Error creating directory: " + err);
			}
			else {
				console.log(constants.name + ": Successfully created upload directory!");
			}
		});
		console.log(constants.name + ": Done!");
	}
	else {
		console.log("info: [plugins] " + constants.name + ": Upload path exists");
	}
});

var Imgbed = {},
	XRegExp = require('xregexp').XRegExp,
	extensions = userExt ? userExt.split(',') : ['jpg', 'jpeg', 'gif', 'png'],  // add capability for control panel here
	regexStr = '<a href="(?<url>https?://[^\.]+\.[^\/]+\/[^\.]+\.(' + extensions.join('|') + '))">[^<]*<\/a>';

// declare regex as global and case-insensitive
var regex = XRegExp(regexStr, 'gi');

var dlUrl = function(rawUrl){ //convert the raw url to an upload url on this server
	rawUrl = rawUrl.replace(XRegExp('[^A-Za-z_0-9.-]', 'gi'), '_');
	console.log("dlUrl: " + rawUrl);
	return rawUrl;
}

Imgbed.parse = function(postContent, callback){
	postContent = XRegExp.replace(postContent, regex, function(match){
		var embedUrl = "";
		if (uploadHotlinks == 1){ // arg javascript
			var urlFilename = dlUrl(match.url);
			// TODO: download the match.url into the upload/imgbed dir with the urlFilename


			console.log("Imgbed: " + relativeUrl + urlFilename);
			embedUrl = relativeUrl + urlFilename; // make an option for FQDN
			console.log("Uploading: " + embedUrl);
			console.log(uploadHotlinks);
		}
		else {
			embedUrl = match.url;
			console.log("Not Uploading: " + embedUrl);
			console.log(uploadHotlinks);
		}
		return '<img src="' + embedUrl + '" alt="' + match.url + '">';
	});
	
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
