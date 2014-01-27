//library.js

(function (module){
	"use strict";
	var		fs = require('fs'),
			path = require('path'),
			mkdirp = require('mkdirp'),
			spawn = require('child_process').spawn,
			nconf = module.parent.require('nconf'),
			winston = require('winston'),
			SocketIndex = module.parent.require('./socket.io/index'),
			templates = module.parent.require('../public/src/templates.js');

	var constants = Object.freeze({
		"name": "Imgbed",
		"admin": {
			"route": "/imgbed/",
			"icon": "fa-th-large"
		}
	});

	var imgDebug = true;

	var uploadHotlinks = meta.config['nodebb-plugin-imgbed:options:upload'],
		userExt = meta.config['nodebb-plugin-imgbed:options:extensions'],
		relativeUrl = "/uploads" + constants.admin.route,
		wgetUploadPath = path.join('.', nconf.get('upload_path'), constants.admin.route),
		uploadUrl = path.join(nconf.get('base_dir'), wgetUploadPath); // for creating the dir

	if (imgDebug){
		console.log("relativeUrl: " + relativeUrl);
		console.log("wgetUploadPath: " + wgetUploadPath);
		console.log("uploadUrl: " + uploadUrl);
	}

	// check to see if the uploads path exists, create it if not there
	fs.exists(uploadUrl, function(exists){
		if(!exists){
			winston.info("[plugins] " + constants.name + ": Path doesn't exist, creating " + uploadUrl);
			mkdirp(uploadUrl, function(err){
				if (err){
					winston.warn("[plugins] " + constants.name + ": Error creating directory: " + err);
				}
				else {
					winston.info("[plugins] " + constants.name + ": Successfully created upload directory!");
				}
			});
		}
		else {
			winston.info("[plugins] " + constants.name + ": Upload path exists");
		}
	});


	var Imgbed = {},
		XRegExp = require('xregexp').XRegExp,
		extensions = userExt ? userExt.split(',') : ['jpg', 'jpeg', 'gif', 'png'],  // add capability for control panel here
		regexStr = '<a href="(?<url>https?://[^\.]+\.[^\/]+\/[^"]+\.(' + extensions.join('|') + '))">[^<]*<\/a>';

	// declare regex as global and case-insensitive
	var regex = XRegExp(regexStr, 'gi'),
		urlRegex = XRegExp('[^A-Za-z_0-9.-]', 'gi'),
		divIDRegex = XRegExp('[.]', 'g');


	// takes care of changing and downloading the url if needed
	var getUrl = function(rawUrl, imageNum){
		if (uploadHotlinks == 0){
			return rawUrl;
		}
		else {
			var cleanFn = rawUrl.replace(urlRegex, '_');
			var imgsrcPath = relativeUrl + cleanFn;
			var fsPath = path.join(wgetUploadPath, cleanFn);
			var divID = cleanFn.replace(divIDRegex, ''); // div id's can't contain dot

			if (fs.existsSync(fsPath)){
				
				//console.log("Sync: file exists, returning modified URL:" + imgsrcPath + "(" + imageNum + ")");
				return '<div id="' + divID + '"> <img src="' + imgsrcPath + '" alt="' + rawUrl + '" ></div>';
			}

			fs.exists(fsPath, function(exist){ 
				if (!exist){
					if (imgDebug) console.log ("File not found for " + imgsrcPath);
					var percent = 0;
					var file = fs.createWriteStream( fsPath );
					var curl = spawn('curl', [rawUrl]);
					curl.stdout.on('data', function(data) { 
						file.write(data); 
						sendClient(divID, percent++);
					});
					curl.stdout.on('end', function(data) {
						file.end();
						if (imgDebug) console.log("File downloaded! " + rawUrl);
						sendClientEnd(divID, imgsrcPath, rawUrl);
					});
					curl.on('exit', function(code) {
						if (code != 0) {
							winston.warn('Failed: ' + code);
						}
					});
				}
				else {
					if (imgDebug) console.log("file exists: " + fsPath);
					sendClientEnd(divID, imgsrcPath, rawUrl);
				}
			});
			
			// TODO: setting: max size to download

			// insert a placeholder
			return '<div id="' + divID + '"></div>';

			
		}
	}

	// send downloading information to the client
	var sendClient = function (id, percent){
		SocketIndex.server.sockets.emit('event:imgbed.server.rcv', { id: id, percent: percent});
	}

	// send the message that the picture finished downloading
	var sendClientEnd = function (id, url, alt){
		SocketIndex.server.sockets.emit('event:imgbed.server.rcv.end', { id: id, url: url, alt: alt} );
	}


	Imgbed.parse = function(postContent, callback){
		//var imageNum = 0;
		postContent = XRegExp.replace(postContent, regex, function(match){
				return getUrl(match.url);
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

	Imgbed.getScripts = function(scripts, callback){
		return scripts.concat(['plugins/nodebb-plugin-imgbed/js/imgbed_main.js']);
	}

	module.exports = Imgbed;

}(module));
