/*global it:false describe:false before:false */

const assert = require('assert')
const mockery = require('mockery')
const rewire = require('rewire')

let settingsExtensions = 'jpg,jpeg,png,gif'
let settingsParseMode = ''

mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false
})

mockery.registerMock('./src/settings', function (name, version, defaultSettingsObj, cb) {
  return {
    get: function (parameter) {
      if (parameter === 'strings.extensions') {
        return settingsExtensions
      }
      if (parameter === 'strings.parseMode') {
        return settingsParseMode
      }
    }
  }
})

mockery.registerMock('./src/posts/cache', {
  reset: function () {
    console.log('cache cleared')
  }
})

mockery.registerMock('./src/socket.io/admin', {
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
  before(function () {
    settingsParseMode = 'markdown'
    imgbed.init()
  })

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
      output: '![image_one.jpg](http://images.google.com/path/image_one.jpg) \n ![image_two.gif](https://images.google.com/anotherpath/image_two.gif)'},
    {desc: 'handle POSIX fully portable filenames',
      body: 'http://images.google.com/path/image.name-ONE_oh3424.jpg\n',
      output: '![image.name-ONE_oh3424.jpg](http://images.google.com/path/image.name-ONE_oh3424.jpg)\n'}
  ]

  var should_not = [
    {desc: 'parse a non-image url into markdown syntax',
      body: 'http://images.google.com/path/index.html'},
    {desc: 'convert image names',
      body: 'that unicorn.jpg was really cool'},
    {desc: 'convert imperfect markdown syntax',
      body: '![markdown.jpg](  http://images.google.com/images/markdown.jpg )'},
    {desc: 'convert markdown syntax',
      body: '![markdown.jpg](http://images.google.com/images/markdown.jpg)'},
    {desc: 'convert parenthesized urls',
      body: 'something something (  http://images.google.com/images/markdown.jpg ) something else'}
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

describe('parse_to_bbcode', function () {
  before(function () {
    settingsParseMode = 'bbcode'
    imgbed.init()
  })
  // test values, these get passed into a loop that runs the same form of test
  var should = [
    {desc: 'parse an http image url into bbcode syntax',
      body: 'http://images.google.com/path/image.jpg',
      output: '[img alt="image.jpg" title="image.jpg"]http://images.google.com/path/image.jpg[/img]'},
    {desc: 'parse an https image url into bbcode syntax',
      body: 'https://images.google.com/path/image.jpg',
      output: '[img alt="image.jpg" title="image.jpg"]https://images.google.com/path/image.jpg[/img]'},
    {desc: 'preserve case',
      body: 'https://images.google.com/path/imAge.jpg',
      output: '[img alt="imAge.jpg" title="imAge.jpg"]https://images.google.com/path/imAge.jpg[/img]'},
    {desc: 'handle multiple subdomains and paths',
      body: 'http://cdn.images.google.com/path/to/asset/image.jpg',
      output: '[img alt="image.jpg" title="image.jpg"]http://cdn.images.google.com/path/to/asset/image.jpg[/img]'},
    {desc: 'handle facebook urls',
      body: 'https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2',
      output: '[img alt="10556276_10205923028580508_6898116064636149990_n.jpg" title="10556276_10205923028580508_6898116064636149990_n.jpg"]https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2[/img]'},
      {desc: 'handle weird query strings',
      body: 'http://vignette2.wikia.nocookie.net/monster/images/c/c4/Unicorn.jpg/revision/latest?cb=20090425203919',
      output: '[img alt="Unicorn.jpg" title="Unicorn.jpg"]http://vignette2.wikia.nocookie.net/monster/images/c/c4/Unicorn.jpg/revision/latest?cb=20090425203919[/img]'},
    {desc: 'parse multiple images into bbcode syntax',
      body: 'http://images.google.com/path/image_one.jpg \n https://images.google.com/anotherpath/image_two.gif',
      output: '[img alt="image_one.jpg" title="image_one.jpg"]http://images.google.com/path/image_one.jpg[/img] \n [img alt="image_two.gif" title="image_two.gif"]https://images.google.com/anotherpath/image_two.gif[/img]'},
    {desc: 'handle POSIX fully portable filenames',
      body: 'http://images.google.com/path/image.name-ONE_oh3424.jpg\n',
      output: '[img alt="image.name-ONE_oh3424.jpg" title="image.name-ONE_oh3424.jpg"]http://images.google.com/path/image.name-ONE_oh3424.jpg[/img]\n'}
  ]

  var should_not = [
    {desc: 'parse a non-image url into bbcode syntax',
      body: 'http://images.google.com/path/index.html'},
    {desc: 'convert image names',
      body: 'that unicorn.jpg was really cool'},
    {desc: 'convert imperfect bbcode syntax',
      body: '[img alt="bbcode.jpg" title="bbcode.jpg"]  http://images.google.com/images/bbcode.jpg [/img]'},
    {desc: 'convert bbcode syntax',
      body: '[img alt="bbcode.jpg" title="bbcode.jpg"]http://images.google.com/images/bbcode.jpg[/img]'}
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

describe('parse_to_html', function () {
  before(function () {
    settingsParseMode = 'html'
    imgbed.init()
  })
  // test values, these get passed into a loop that runs the same form of test
  var should = [
    {desc: 'parse an http image url into html syntax',
      body: 'http://images.google.com/path/image.jpg',
      output: '<img src="http://images.google.com/path/image.jpg" alt="image.jpg" title="image.jpg">'},
    {desc: 'parse an https image url into html syntax',
      body: 'https://images.google.com/path/image.jpg',
      output: '<img src="https://images.google.com/path/image.jpg" alt="image.jpg" title="image.jpg">'},
    {desc: 'preserve case',
      body: 'https://images.google.com/path/imAge.jpg',
      output: '<img src="https://images.google.com/path/imAge.jpg" alt="imAge.jpg" title="imAge.jpg">'},
    {desc: 'handle multiple subdomains and paths',
      body: 'http://cdn.images.google.com/path/to/asset/image.jpg',
      output: '<img src="http://cdn.images.google.com/path/to/asset/image.jpg" alt="image.jpg" title="image.jpg">'},
    {desc: 'handle facebook urls',
      body: 'https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2',
      output: '<img src="https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xtf1/v/t1.0-9/10556276_10205923028580508_6898116064636149990_n.jpg?oh=b76c8570670331d831d04ec146aeb6b5&o_e=5736A9F2" alt="10556276_10205923028580508_6898116064636149990_n.jpg" title="10556276_10205923028580508_6898116064636149990_n.jpg">'},
      {desc: 'handle weird query strings',
      body: 'http://vignette2.wikia.nocookie.net/monster/images/c/c4/Unicorn.jpg/revision/latest?cb=20090425203919',
      output: '<img src="http://vignette2.wikia.nocookie.net/monster/images/c/c4/Unicorn.jpg/revision/latest?cb=20090425203919" alt="Unicorn.jpg" title="Unicorn.jpg">'},
    {desc: 'parse multiple images into html syntax',
      body: 'http://images.google.com/path/image_one.jpg \n https://images.google.com/anotherpath/image_two.gif',
      output: '<img src="http://images.google.com/path/image_one.jpg" alt="image_one.jpg" title="image_one.jpg"> \n <img src="https://images.google.com/anotherpath/image_two.gif" alt="image_two.gif" title="image_two.gif">'},
    {desc: 'handle POSIX fully portable filenames',
      body: 'http://images.google.com/path/image.name-ONE_oh3424.jpg\n',
      output: '<img src="http://images.google.com/path/image.name-ONE_oh3424.jpg" alt="image.name-ONE_oh3424.jpg" title="image.name-ONE_oh3424.jpg">\n'}
  ]

  var should_not = [
    {desc: 'parse a non-image url into html syntax',
      body: 'http://images.google.com/path/index.html'},
    {desc: 'convert image names',
      body: 'that unicorn.jpg was really cool'},
    {desc: 'convert imperfect html syntax',
      body: '<img src = "  http://images.google.com/images/html.jpg " alt="html.jpg" title="html.jpg">'},
    {desc: 'convert html syntax',
      body: '<img src="http://images.google.com/images/html.jpg" alt="html.jpg" title="html.jpg">'}
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
