/*global env:false */

(function (module) {
  'use strict'
  var winston = require('winston')
  var CacheLRU = require('cache-lru')
  var merge = require('lodash.merge')
  var XRegExp = merge(require('xregexp').XRegExp, require('xregexp-lookbehind'))
  var Settings = module.parent.require('./settings')
  var Cache = module.parent.require('./posts/cache')
  var SocketAdmin = module.parent.require('./socket.io/admin')
  var debug

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
    winston.info('Imgbed in debug mode!')
  }

  var settings = new Settings('imgbed', '0.2.0', defaultSettings, function () {
    if (debug) {
      winston.info('Imgbed settings loaded')
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
      winston.info('Imgbed: user defined extensions is ' + userExt)
      winston.info('Imgbed: parse mode is ' + parseMode)
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
        embedSyntax = '<img src="${url}" alt="${filename}" title="${filename}">'
        break
      case 'bbcode':
        preString = '\\[img[^\\]]*\\]'
        embedSyntax = '[img alt="${filename}" title="${filename}"]${url}[/img]'
        break
      default: // markdown
        preString = '\\('
        embedSyntax = '![${filename}](${url})'
        break
    }

    // declare regex as global and case-insensitive
    regex = XRegExp(regexStr, 'gi')
    winston.info('Imgbed: regex recompiled: ' + regexStr)
    localCache = new CacheLRU()
    localCache.limit(3)
    winston.info('Imgbed: cache initialized to size 3')
  }

  Imgbed.parseRaw = function (content, callback) {
    if (!content) {
      return callback(null, content)
    }
    var parsedContent = localCache.get(content)
    if (!parsedContent) {
      if (debug) {
        winston.info('Imgbed: cache miss')
      }

      parsedContent = XRegExp.replaceLb(content, '(?<!' + preString + '\\s*)', regex, embedSyntax)
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
      winston.info('Imgbed: syncing settings')
    }
    settings.sync(Imgbed.init)
  }

  SocketAdmin.settings.clearPostCache = function (data) {
    if (debug) {
      winston.info('Clearing all posts from cache')
    }
    Cache.reset()
    // SocketAdmin.emit('admin.settings.postCacheCleared', {});
  }

  Imgbed.admin = {
    menu: function (custom_header, callback) {
      custom_header.plugins.push({
        'route': constants.admin.route,
        'icon': constants.admin.icon,
        'name': constants.admin.name
      })
      callback(null, custom_header)
    }
  }
  module.exports = Imgbed
}(module))
