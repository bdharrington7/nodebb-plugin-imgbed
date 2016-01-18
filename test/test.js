/*global it:false describe:false */

var assert = require('assert')
var mock = require('mock-require')
var rewire = require('rewire')

mock('./settings', function (name, version, defaultSettingsObj, cb) {
  return {
    get: function (parameter) {
      if (parameter === 'strings.extensions') {
        return 'jpg,jpeg,png'
      }
    }
  }
})

mock('./posts/cache', {
  reset: function () {
    console.log('cache cleared')
  }
})

mock('./socket.io/admin', {
  settings: {}
  // console.log ('called mock socket.io')
})

var imgbed = rewire('../library')
imgbed.__set__('env', 'prod')

// mocked out params for onLoad function
var params = {
  router: {
    get: function (path) {
      // nothing to do
    }
  },
  middleware: {
    admin: {
      buildHeader: ''
    }
  }
}

imgbed.onLoad(params, function () {
  // nothing to do
})

// data payload for parsing function, data.postData.content holds the message body
var createPayload = function (unprocessedPost) {
  return {
    postData: {
      content: unprocessedPost
    }
  }
}

var testEquals = function (err, data, expectedBody) {
  assert.equal(err, null)
  assert.equal(data.postData.content, expectedBody)
}

describe('parse_to_markdown', function () {
  it('should parse an http image url into markdown syntax', function (done) {
    var testBody = 'http://images.google.com/path/image.jpg'
    var parsedBody = '![image.jpg](http://images.google.com/path/image.jpg)'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, parsedBody)
      done()
    })
  })

  it('should parse an https image url into markdown syntax', function (done) {
    var testBody = 'https://images.google.com/path/image.jpg'
    var parsedBody = '![image.jpg](https://images.google.com/path/image.jpg)'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, parsedBody)
      done()
    })
  })

  it('shouldn\'t parse a non-image url into markdown syntax', function (done) {
    var testBody = 'http://images.google.com/path/index.html'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, testBody) // should be the same
      done()
    })
  })
})
