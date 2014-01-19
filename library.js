//library.js

(function (module){
	"use strict";
	var		fs = require('fs'),
			path = require('path'),
			mkdirp = require('mkdirp'),
			exec = require('child_process').exec,
			spawn = require('child_process').spawn,
			nconf = module.parent.require('nconf'),
			winston = require('winston'),
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
		relativeUrl = "/uploads" + constants.admin.route,
		wgetUploadPath = path.join(nconf.get('upload_path'), constants.admin.route);


	fs.exists(uploadUrl, function(exists){
		if(!exists){
			winston.info(constants.name + ": Path doesn't exist, creating " + uploadUrl);
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
			winston.info("[plugins] " + constants.name + ": Upload path exists");
		}
	});

	var Imgbed = {},
		XRegExp = require('xregexp').XRegExp,
		extensions = userExt ? userExt.split(',') : ['jpg', 'jpeg', 'gif', 'png'],  // add capability for control panel here
		regexStr = '<a href="(?<url>https?://[^\.]+\.[^\/]+\/[^\.]+\.(' + extensions.join('|') + '))">[^<]*<\/a>';

	// declare regex as global and case-insensitive
	var regex = XRegExp(regexStr, 'gi'),
		urlRegex = XRegExp('[^A-Za-z_0-9.-]', 'gi');

	var dlUrl = function(rawUrl){ //convert the raw url to an upload url on this server
		rawUrl = rawUrl.replace(XRegExp('[^A-Za-z_0-9.-]', 'gi'), '_');
		console.log("dlUrl: " + rawUrl);
		return rawUrl;
	}

	// takes care of changing and downloading the url if needed
	var getUrl = function(rawUrl){
		if (uploadHotlinks == 0){
			return rawUrl;
		}
		else {
			var cleanFn = rawUrl.replace(urlRegex, '_');
			var fullRelPath = relativeUrl + cleanFn;
			var fullWgetPath = path.join('.', wgetUploadPath, cleanFn);

			// TODO: download the match.url into the upload/imgbed dir with the urlFilename
			fs.exists(fullWgetPath, function(exist){ 
				if (!exist){
					console.log ("File not found for " + fullRelPath);
					// debugger;
					//fs.openSync(fullWgetPath, 'w'); // touch the file so something exists there before the download finishes
					var file = fs.createWriteStream( fullWgetPath );
					var curl = spawn('curl', [rawUrl]);
					curl.stdout.on('data', function(data) { file.write(data); });
					curl.stdout.on('end', function(data) {
						file.end();
						console.log("File downloaded! " + rawUrl);
					});
					curl.on('exit', function(code) {
						if (code != 0) {
							console.log('Failed: ' + code);
						}
					});
					// var wget = "wget " + rawUrl + " -O " + fullWgetPath;
					// var child = exec(wget, function (err, stdout, stderr){
					// 	if (err){
					// 		console.log(constants.name + ": Error wget-ing " + rawUrl + stderr);
					// 		console.log(err);
					// 	}
					// 	else {
					// 		console.log(constants.name + ": Successfully downloaded " + rawUrl + stdout);
					// 	}
					// });
				}
				else {
					console.log("file exists: " + fullWgetPath);
				}
			});
			
			// TODO: setting: max size to download

			return fullRelPath;
		}
	}

	Imgbed.parse = function(postContent, callback){
		postContent = XRegExp.replace(postContent, regex, function(match){
			// var embedUrl = "";
			// if (uploadHotlinks == 1){ // arg javascript
			// 	var urlFilename = dlUrl(match.url);
			// 	// TODO: download the match.url into the upload/imgbed dir with the urlFilename

			// 	// TODO: setting: max size to download


			// 	console.log("Imgbed: " + relativeUrl + urlFilename);
			// 	embedUrl = relativeUrl + urlFilename; // make an option for FQDN
			// 	console.log("Uploading: " + embedUrl);
			// 	console.log(uploadHotlinks);
			// }
			// else {
			// 	embedUrl = match.url;
			// 	console.log("Not Uploading: " + embedUrl);
			// 	console.log(uploadHotlinks);
			// }
			return '<img src="' + getUrl(match.url) + '" alt="' + match.url + '">';
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

}(module));
