//library.js

(function (module){
	'use strict';
	var	winston = require('winston'),
			path = require('path'),
			nodejsUrl = require('url'),
			XRegExp = require('xregexp').XRegExp,
			Settings = module.parent.require('./settings'),
			Cache = module.parent.require('./posts/cache'),
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
			winston.info('Imgbed: user defined extensions is ' + userExt);
		}

		var extensionsArr = (userExt && userExt.length > 0)
				? userExt.split(',')
				: defaultSettings.strings.extensions.split(',');

		extensionsArr = extensionsArr.map(function(str){
			return str.trim();
		});

		regexStr = '(?<paren>[\\(]\\s*)?(?<url>https?:\/\/[^\\s]+\\.(' + extensionsArr.join('|') + '))';

		// declare regex as global and case-insensitive
		regex = XRegExp(regexStr, 'gi');
		winston.info("Imgbed: regex recalculated: " + regexStr);
	};

	Imgbed.parse = function (data, callback) {
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
		}
		settings.sync(Imgbed.init);
	}

	SocketAdmin.settings.clearPostCache = function(data) {
		if (debug) {
			winston.info('Clearing all posts from cache');
		}
		Cache.reset();
		// SocketAdmin.emit('admin.settings.postCacheCleared', {});
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

	module.exports = Imgbed;

}(module));
