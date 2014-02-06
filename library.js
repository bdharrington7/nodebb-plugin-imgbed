//library.js

(function (module){
	"use strict";
	var		fs = require('fs'),
			path = require('path'),
			mkdirp = require('mkdirp'),
			spawn = require('child_process').spawn,
			nconf = module.parent.require('nconf'),
			winston = require('winston'),
			socketIndex = module.parent.require('./socket.io/index'),
			templates = module.parent.require('../public/src/templates.js');

	var constants = Object.freeze({
		"name": "Imgbed",
		"admin": {
			"route": "/imgbed/",
			"icon": "fa-th-large"
		},
		"namespace": "nodebb-plugin-imgbed"
	});

	var debug = env == 'development';

	var uploadHotlinks = meta.config[constants.namespace + ':options:upload'],
		userExt = meta.config[constants.namespace + ':options:extensions'],
		relativeUrl = "/uploads" + constants.admin.route,
		wgetUploadPath = path.join('.', nconf.get('upload_path'), constants.admin.route),
		uploadUrl = path.join(nconf.get('base_dir'), wgetUploadPath); // for creating the dir

	// check to see if the uploads path exists, create it if not there
	fs.exists(uploadUrl, function(exists){
		if(!exists){
			winston.info("[plugins/" + constants.namespace + "] Path doesn't exist, creating " + uploadUrl);
			mkdirp(uploadUrl, function(err){
				if (err){
					winston.warn("[plugins/" + constants.namespace + "] Error creating directory: " + err);
				}
				else {
					winston.info("[plugins/" + constants.namespace + "] Successfully created upload directory!");
				}
			});
		}
		else {
			winston.info("[plugins/" + constants.namespace + "] Upload path exists");
		}
	});

	socketIndex.server.sockets.on('event:imgbed.debug', function(data){
		console.log(data);
		console.log("pong");
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
			return '<img src="' + rawUrl + '">';
		}
		else {
			var cleanFn = rawUrl.replace(urlRegex, '_'),
				imgsrcPath = relativeUrl + cleanFn,
				fsPath = path.join(wgetUploadPath, cleanFn),
				divID = cleanFn.replace(divIDRegex, ''); // div id's can't contain dot

			if (fs.existsSync(fsPath)){
				return '<div id="' + divID + '"> <img src="' + imgsrcPath + '" alt="' + rawUrl + '" ></div>';
			} // else return the original url and download in the background?

			fs.exists(fsPath, function(exist){ 
				if (!exist){
					if (debug) {
						winston.info ("File not found for " + imgsrcPath);
					}
					var percent = 0,
						file = fs.createWriteStream( fsPath ),
						curl = spawn('curl', [rawUrl]);

					curl.stdout.on('data', function(data) { 
						file.write(data); 
						sendClient(divID, percent++);
					});
					curl.stdout.on('end', function(data) {
						file.end();
						if (debug) winston.info("File downloaded! " + rawUrl);
						sendClientEnd(divID, imgsrcPath, rawUrl);
					});
					curl.on('error', function(err){ //??
						winston.error ("Error downloading image! ");
						winston.error(err);

					});
					curl.on('exit', function(code) {
						if (code != 0) {
							winston.warn('Failed: ' + code);
						}
					});
				}
				else {
					if (debug) {
						winston.info("file exists: " + fsPath);
					}
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
		winston.info("Firing off socket message that download is occurring");
		socketIndex.server.sockets.emit('event:imgbed.server.rcv', { id: id, percent: percent});
	}

	// send the message that the picture finished downloading
	var sendClientEnd = function (id, url, alt){
		winston.info("Firing off socket message that download is DONE");
		socketIndex.server.sockets.emit('event:imgbed.server.rcv.end', { id: id, url: url, alt: alt} );
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
		return scripts.concat(['plugins/imgbed/js/imgbed_main.js']);
	}

	module.exports = Imgbed;

}(module));
