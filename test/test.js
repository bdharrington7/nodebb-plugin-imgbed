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
  // test values, these get passed into a loop that runs the same form of test
  var should = [
    {desc: 'parse an http image url into markdown syntax',
      body: 'http://images.google.com/path/image.jpg',
      output: '![image.jpg](http://images.google.com/path/image.jpg)'},
    {desc: 'parse an https image url into markdown syntax',
      body: 'https://images.google.com/path/image.jpg',
      output: '![image.jpg](https://images.google.com/path/image.jpg)'},
    {desc: 'preserve case',
      body: 'https://images.google.com/path/imAge.jpg',
      output: '![imAge.jpg](https://images.google.com/path/imAge.jpg)'},
    {desc: 'handle multiple subdomains and paths',
      body: 'http://cdn.images.google.com/path/to/asset/image.jpg',
      output: '![image.jpg](http://cdn.images.google.com/path/to/asset/image.jpg)'},
    {desc: 'handle facebook urls',
      body: 'https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2',
      output: '![10556276_10205923028580508_6898116064636149990_n.jpg](https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2)'},
      {desc: 'handle weird query strings',
      body: 'http://vignette2.wikia.nocookie.net/monster/images/c/c4/Unicorn.jpg/revision/latest?cb=20090425203919',
      output: '![Unicorn.jpg](http://vignette2.wikia.nocookie.net/monster/images/c/c4/Unicorn.jpg/revision/latest?cb=20090425203919)'},
    {desc: 'parse multiple images into markdown syntax',
      body: 'http://images.google.com/path/image_one.jpg \n https://images.google.com/anotherpath/image_two.gif',
      output: '![image_one.jpg](http://images.google.com/path/image_one.jpg) \n ![image_two.gif](https://images.google.com/anotherpath/image_two.gif)'}
  ]

  var should_not = [
    {desc: 'parse a non-image url into markdown syntax',
      body: 'http://images.google.com/path/index.html'},
    {desc: 'convert image names',
      body: 'that unicorn.jpg was really cool'},
    {desc: 'convert imperfect markdown syntax',
      body: '![markdown.jpg](  http://images.google.com/images/markdown.jpg )'},
    {desc: 'convert markdown syntax',
      body: '![markdown.jpg](http://images.google.com/images/markdown.jpg)'}
  ]

  // test loops
  should.forEach(function (test) {
    it('should ' + test.desc, function (done) {
      var data = createPayload(test.body)
      imgbed.parse(data, function (err, data) {
        testEquals(err, data, test.output)
        done()
      })
    })
  })

  should_not.forEach(function (test) {
    it('shouldn\'t ' + test.desc, function (done) {
      var data = createPayload(test.body)
      imgbed.parse(data, function (err, data) {
        testEquals(err, data, test.body) // should be the same
        done()
      })
    })
  })
})
