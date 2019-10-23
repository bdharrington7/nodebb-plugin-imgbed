/* global env:false */

(function (module) {
  'use strict'
  const winston = require('winston')
  const CacheLRU = require('cache-lru')
  const regexEngine = Object.assign(require('xregexp'), require('xregexp-lookbehind'))
  const Settings = require.main.require('./src/settings')
  const Cache = require.main.require('./src/posts/cache')
  const SocketAdmin = require.main.require('./src/socket.io/admin')

  const log = winston.createLogger({
    level: (env === 'development') ? 'debug' : 'info',
    format: winston.format.simple(),
    transports: [
      new winston.transports.Console()
    ]
  })

  var constants = Object.freeze({
    name: 'Imgbed',
    admin: {
      route: '/plugins/imgbed',
      icon: 'fa-th-large',
      name: 'Imgbed'
    },
    namespace: 'nodebb-plugin-imgbed'
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

  log.debug('Imgbed in debug mode!')

  const settings = new Settings('imgbed', '0.2.0', defaultSettings, function () {
    log.debug('Imgbed settings loaded')
  })

  const Imgbed = {}

  let regex
  let preString
  let embedSyntax
  let localCache

  Imgbed.init = function () {
    const userExt = settings.get('strings.extensions')
    const parseMode = settings.get('strings.parseMode')
    log.debug('Imgbed: user defined extensions is ' + userExt)
    log.debug('Imgbed: parse mode is ' + parseMode)

    let extensionsArr = (userExt && userExt.length > 0)
      ? userExt.split(',')
      : defaultSettings.strings.extensions.split(',')

    extensionsArr = extensionsArr.map(function (str) {
      return str.trim()
    })

    const regexStr = '(?<url>https?:\\/\\/[^\\s]+\\/(?<filename>[\\w_0-9\\-\\.]+\\.(' + extensionsArr.join('|') + '))([^\\s]*)?)'

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
    let parsedContent = localCache.get(content)
    if (!parsedContent) {
      log.debug('Imgbed: cache miss')

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
    function render (req, res, next) {
      res.render('admin/plugins/imgbed')
    }

    params.router.get('/admin/plugins/imgbed', params.middleware.admin.buildHeader, render)
    params.router.get('/api/admin/plugins/imgbed', render)

    Imgbed.init()
    callback()
  }

  SocketAdmin.settings.syncImgbed = function (data) {
    log.debug('Imgbed: syncing settings')
    settings.sync(Imgbed.init)
  }

  SocketAdmin.settings.clearPostCache = function (data) {
    log.debug('Clearing all posts from cache')
    Cache.reset()
    // SocketAdmin.emit('admin.settings.postCacheCleared', {});
  }

  Imgbed.admin = {
    menu: function (customHeader, callback) {
      customHeader.plugins.push({
        route: constants.admin.route,
        icon: constants.admin.icon,
        name: constants.admin.name
      })
      callback(null, customHeader)
    }
  }
  module.exports = Imgbed
}(module))
