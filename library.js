/* global env:false */

(function (module) {
  'use strict'
  const { createLogger, format, transports } = require('winston')
  const { combine, colorize, label, timestamp, printf } = format
  const CacheLRU = require('cache-lru')
  const regexEngine = Object.assign(require('xregexp'), require('xregexp-lookbehind'))
  const Settings = require.main.require('./src/settings')
  const Cache = require.main.require('./src/posts/cache')
  const SocketAdmin = require.main.require('./src/socket.io/admin')
  const CACHE_SIZE = 3

  function isDev() {
    return env === 'development'
  }

  const logFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} - ${level}: [${label}] ${message}`;
  })

  const formats = []
  if (isDev()) {
    formats.push(colorize())
  }
  formats.push(
    timestamp(),
    label({ label: 'plugin:Imgbed'}),
    logFormat
   )

  const log = createLogger({
    level: isDev() ? 'debug' : 'info',
    format: combine(...formats),
    transports: [
      new transports.Console()
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

  const settings = new Settings('imgbed', '0.2.0', defaultSettings, function () {
    log.debug('Settings loaded.')
  })

  const Imgbed = {}

  let regex
  let preString
  let embedSyntax
  let localCache

  Imgbed.init = function () {
    const userExt = settings.get('strings.extensions')
    const parseMode = settings.get('strings.parseMode')
    log.debug(`User defined extensions are ${userExt}`)
    log.debug(`Parse mode is ${parseMode}`)

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
    log.info(`Regex recompiled: ${regexStr}`)
    localCache = new CacheLRU()
    localCache.limit(CACHE_SIZE)
    log.info(`Cache initialized to size ${CACHE_SIZE}`)
  }

  Imgbed.parseRaw = function (content, callback) {
    if (!content) {
      return callback(null, content)
    }
    let parsedContent = localCache.get(content)
    if (!parsedContent) {
      log.debug('Cache miss')

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
    log.debug('Syncing settings...')
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
