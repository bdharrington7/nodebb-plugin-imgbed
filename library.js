/* global env:false */

(function (module) {
  'use strict'
  var winston = require('winston')
  var CacheLRU = require('cache-lru')
  var regexEngine = Object.assign(require('xregexp'), require('xregexp-lookbehind'))
  var Settings = require.main.require('./src/settings')
  var Cache = require.main.require('./src/posts/cache')
  var SocketAdmin = require.main.require('./src/socket.io/admin')
  var debug = false

  const log = winston.createLogger({
    level: debug ? 'debug' : 'info',
    format: winston.format.simple(),
    transports: [
      new winston.transports.Console()
    ]
  })

  var constants = Object.freeze({
    'name': 'Imgbed',
    'admin': {
      'route': '/plugins/imgbed',
      'icon': 'fa-th-large',
      'name': 'Imgbed'
    },
    'namespace': 'nodebb-plugin-imgbed'
  })

  var defaultSettings = {
    booleans: {
      hasMarkdown: true
    },
    strings: {
      extensions: 'jpg,jpeg,gif,gifv,png,svg',
      parseMode: 'markdown'
    }
  }

  if (debug) {
    log.info('Imgbed in debug mode!')
  }

  var settings = new Settings('imgbed', '0.2.0', defaultSettings, function () {
    if (debug) {
      log.info('Imgbed settings loaded')
    }
  })

  var Imgbed = {}

  var regex
  var preString
  var regexStr
  var embedSyntax
  var localCache

  Imgbed.init = function () {
    var userExt = settings.get('strings.extensions')
    var parseMode = settings.get('strings.parseMode')
    if (debug) {
      log.info('Imgbed: user defined extensions is ' + userExt)
      log.info('Imgbed: parse mode is ' + parseMode)
    }

    var extensionsArr = (userExt && userExt.length > 0)
      ? userExt.split(',')
      : defaultSettings.strings.extensions.split(',')

    extensionsArr = extensionsArr.map(function (str) {
      return str.trim()
    })

    regexStr = '(?<url>https?:\\/\\/[^\\s]+\\/(?<filename>[\\w_0-9\\-\\.]+\\.(' + extensionsArr.join('|') + '))([^\\s]*)?)'

    switch (parseMode) {
      case 'html':
        preString = 'src\\s*\\=\\s*\\"'
        embedSyntax = '<img src="${url}" alt="${filename}" title="${filename}">'  // eslint-disable-line
        break
      case 'bbcode':
        preString = '\\[img[^\\]]*\\]'
        embedSyntax = '[img alt="${filename}" title="${filename}"]${url}[/img]' // eslint-disable-line
        break
      default: // markdown
        preString = '\\('
        embedSyntax = '![${filename}](${url})'  // eslint-disable-line
        break
    }

    // declare regex as global and case-insensitive
    regex = regexEngine(regexStr, 'gi')
    log.info('Imgbed: regex recompiled: ' + regexStr)
    localCache = new CacheLRU()
    localCache.limit(3)
    log.info('Imgbed: cache initialized to size 3')
  }

  Imgbed.parseRaw = function (content, callback) {
    if (!content) {
      return callback(null, content)
    }
    var parsedContent = localCache.get(content)
    if (!parsedContent) {
      if (debug) {
        log.info('Imgbed: cache miss')
      }

      parsedContent = regexEngine.replaceLb(content, '(?<!' + preString + '\\s*)', regex, embedSyntax)
      localCache.set(content, parsedContent)
    }

    callback(null, parsedContent)
  }

  Imgbed.parse = function (data, callback) {
    if (!data || !data.postData) {
      return callback(null, data)
    }

    Imgbed.parseRaw(data.postData.content, function (err, content) {
      if (err) {
        callback(err, data)
      }
      data.postData.content = content
      callback(null, data)
    })
  }

  Imgbed.onLoad = function (params, callback) {
    // console.log('calling onLoad')
    debug = env === 'development'
    function render (req, res, next) {
      res.render('admin/plugins/imgbed')
    }

    params.router.get('/admin/plugins/imgbed', params.middleware.admin.buildHeader, render)
    params.router.get('/api/admin/plugins/imgbed', render)

    Imgbed.init()
    callback()
  }

  SocketAdmin.settings.syncImgbed = function (data) {
    if (debug) {
      log.info('Imgbed: syncing settings')
    }
    settings.sync(Imgbed.init)
  }

  SocketAdmin.settings.clearPostCache = function (data) {
    if (debug) {
      log.info('Clearing all posts from cache')
    }
    Cache.reset()
    // SocketAdmin.emit('admin.settings.postCacheCleared', {});
  }

  Imgbed.admin = {
    menu: function (customHeader, callback) {
      customHeader.plugins.push({
        'route': constants.admin.route,
        'icon': constants.admin.icon,
        'name': constants.admin.name
      })
      callback(null, customHeader)
    }
  }
  module.exports = Imgbed
}(module))
