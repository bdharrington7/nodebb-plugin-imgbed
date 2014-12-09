//library.js

(function (module){
	'use strict';
	var	winston = require('winston'),
			path = require('path'),
			nodejsUrl = require('url'),
			XRegExp = require('xregexp').XRegExp,
			Settings = module.parent.require('./settings'),
			SocketAdmin = module.parent.require('./socket.io/admin')

	var constants = Object.freeze({
		"name": "Imgbed",
		"admin": {
			"route": "/plugins/imgbed/",
			"icon": "fa-th-large",
			"name": "Imgbed"
		},
		"namespace": "nodebb-plugin-imgbed"
	});

	var debug = env == 'development';

	var defaultSettings = {
		booleans: {
			hasMarkdown: true
		},
		strings: {
			extensions: 'jpg,jpeg,gif,gifv,png,svg'
		}
	};

	if (debug) {
		winston.info('Imgbed in debug mode!');
	}

	var settings = new Settings('imgbed', '0.1.1', defaultSettings, function(){
		if (debug) {
			winston.info('Imgbed settings loaded');
		}
	});

	var Imgbed = {};

	var regex,
		regexStr;

	// takes care of changing and downloading the url if needed
	// opening parenthesis, if present, signifies that this is already markdownified
	// this is needed because JS has no negative lookbehind
	var convertToMarkdown = function(paren, rawUrl) {
		if (debug) {
			winston.info('Imgbed: converting url: ' + rawUrl)
		}
		//just change the matching urls to markdown syntax
		var markdownVal = '![' + path.basename(nodejsUrl.parse(rawUrl).pathname) + '](' + rawUrl + ')';
		if (debug) {
			winston.info('...url converted to: ' + markdownVal);
		}
		if (paren) {
			return paren + rawUrl; // return whole match
		}
		return markdownVal;
		// TODO: detect a markdown plugin installed and activated?
	};

	Imgbed.init = function() {
		var	userExt = settings.get('strings.extensions');
		if (debug) {
			winston.info('Imgbed: userExt is ' + userExt);
		}


		var extensionsArr = (userExt && userExt.length > 0)
		? userExt.split(',')
		: defaultSettings.strings.extensions.split(','),
		regexStr = '(?<paren>[\\(]\\s*)?(?<url>https?:\/\/[^\\s]+\\.(' + extensionsArr.join('|') + ')[^\\s]*)';

		// declare regex as global and case-insensitive
		regex = XRegExp(regexStr, 'gi');
	};

	Imgbed.parse = function (data, callback) {
		if(debug) {
			winston.info('Imgbed regex is '+ regexStr);
		}
		if (!data || !data.postData || !data.postData.content) {
			return callback(null, data);
		}

		data.postData.content = XRegExp.replace(data.postData.content, regex, function(match){
				return convertToMarkdown(match.paren, match.url);
			});

		callback(null, data);
	};

	Imgbed.onLoad = function(params, callback) {
		function render(req, res, next) {
			res.render('admin/plugins/imgbed');
		}

		params.router.get('/admin/plugins/imgbed', params.middleware.admin.buildHeader, render);
		params.router.get('/api/admin/plugins/imgbed', render);

		Imgbed.init();
		callback();
	};

	SocketAdmin.settings.syncImgbed = function(data) {
		if (debug) {
			winston.info('Imgbed: syncing settings');
			winston.info(data);
		}
		settings.sync(Imgbed.init);
	}

	Imgbed.admin = {
		menu: function (custom_header, callback) {
			custom_header.plugins.push({
				"route": constants.admin.route,
				"icon": constants.admin.icon,
				"name": constants.admin.name
			});
			callback(null, custom_header);
		}
	};

	// TODO this needs to move somewhere
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
	};

	module.exports = Imgbed;

}(module));
