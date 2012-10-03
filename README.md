**jpegmini** - a wrapper for the [jpegmini](http://www.jpegmini.com) command line tool

## Installation

Requires that [jpegmini](http://www.jpegmini.com) and [exiftool](http://owl.phy.queensu.ca/~phil/exiftool/) are available in `PATH`

```bash
$ npm install jpegmini
```

## Usage

Compress an image

```javascript
var jpegmini = require('jpegmini');

jpegmini.process({
    input: '/path/to/input.jpg'
  , output: '/path/to/output.jpg'
  , quality: jpegmini.BEST
  , skip_compressed: true
  , remove_metadata: false
  , license_cache: '/var/tmp/jpegmini_cache'
}, function (err) {
    //..
});
```

Logging out the cached license

```javascript
jpegmini.logout('/path/to/license_cache', function (err) {
    //...
});
```

## License (MIT)

Copyright (c) 2012 Sydney Stockholm <opensource@sydneystockholm.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

