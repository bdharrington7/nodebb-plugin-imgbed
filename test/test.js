/*global it:false describe:false */

var assert = require('assert')
var mock = require('mock-require')
var rewire = require('rewire')

mock('./settings', function (name, version, defaultSettingsObj, cb) {
  return {
    get: function (parameter) {
      if (parameter === 'strings.extensions') {
        return 'jpg,jpeg,png,gif'
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

// change to 'development' to see debug messaging
// imgbed.__set__('env', 'development')
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

  it('should preserve case', function (done) {
    var testBody = 'https://images.google.com/path/imAge.jpg'
    var parsedBody = '![imAge.jpg](https://images.google.com/path/imAge.jpg)'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, parsedBody)
      done()
    })
  })

  it('should handle multiple subdomains and paths', function (done) {
    var testBody = 'http://cdn.images.google.com/path/to/asset/image.jpg'
    var parsedBody = '![image.jpg](http://cdn.images.google.com/path/to/asset/image.jpg)'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, parsedBody)
      done()
    })
  })

  it('should handle facebook urls', function (done) {
    var testBody = 'https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2'
    var parsedBody = '![10556276_10205923028580508_6898116064636149990_n.jpg](https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2)'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, parsedBody)
      done()
    })
  })

  // this doesn't seem to work in test, but it works in nodebb, haven't figured out why
  it('should parse multiple images into markdown syntax', function (done) {
    var testBody = 'http://images.google.com/path/image_one.jpg \n https://images.google.com/anotherpath/image_two.gif'
    var parsedBody = '![image_one.jpg](http://images.google.com/path/image_one.jpg) \n ![image_two.gif](https://images.google.com/anotherpath/image_two.gif)'
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

  it('shouldn\'t convert image names', function (done) {
    var testBody = 'that unicorn.jpg was really cool'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, testBody) // should be the same
      done()
    })
  })

  it('shouldn\'t convert markdown syntax', function (done) {
    var testBody = '![markdown.jpg](http://images.google.com/images/markdown.jpg)'
    var data = createPayload(testBody)
    imgbed.parse(data, function (err, data) {
      testEquals(err, data, testBody) // should be the same
      done()
    })
  })
})
