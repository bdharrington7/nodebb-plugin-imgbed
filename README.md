nodebb-plugin-imgbed
====================

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/) [![Build Status](https://travis-ci.org/bdharrington7/nodebb-plugin-imgbed.svg?branch=master)](https://travis-ci.org/bdharrington7/nodebb-plugin-imgbed)

Embeds images into a post with just an image url.

This plugin parses links that are image urls and changes them into either:
* markdown: `![image title](http://images.google.com/image-url.jpg)`
* bb code: `[img]https://images.google.com/image.gif[/img]`
* html img tags: `<img src="http://images.google.com/image.png" alt="image.png" title="image.png">`


