# parallel-multistream

Parallel version of [multistream](https://github.com/feross/multistream)

```
npm install parallel-multistream
```

[![build status](http://img.shields.io/travis/mafintosh/parallel-multistream.svg?style=flat)](http://travis-ci.org/mafintosh/parallel-multistream)

## Usage

``` js
var parallel = require('parallel-multistream')

var stream = parallel([stream1, stream2, stream3])

stream.on('data', function(data) {
  // 1st: data will be from stream1
  // 2nd: data will be from stream2
  // 3rd: data will be from stream3
  // 4th: data will be from stream1
  // ...
})

stream.on('end', function() {
  // all streams have ended
})
```

Use `stream.destroy()` to all sub-streams and emit `close`.

If you want to add an additional stream you can call `stream.add(substream)`.

## License

MIT
