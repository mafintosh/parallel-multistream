var stream = require('readable-stream')
var util = require('util')
var fifo = require('fifo')

var toStreams2 = function(s) {
  if (typeof s === 'function' || s._readableState) return s
  var wrap = new stream.Readable().wrap(s)
  if (s.destroy) wrap.destroy = s.destroy.bind(s)  
  return wrap  
}

var Parallel = function(streams, opts) {
  if (!(this instanceof Parallel)) return new Parallel(streams, opts)

  stream.Readable.call(this, opts)
  this.destroyed = false
  this._forwarding = false
  this._drained = false
  this._queue = fifo()
  for (var i = 0; i < streams.length; i++) this.add(streams[i])
  this._current = this._queue.node
}

util.inherits(Parallel, stream.Readable)

Parallel.obj = function(streams) {
  return new Parallel(streams, {objectMode: true, highWaterMark: 16})
}

Parallel.prototype.add = function(s) {
  s = toStreams2(s)

  var self = this  
  var node = this._queue.push(s)

  var onend = function() {
    if (node === self._current) self._current = node.next
    self._queue.remove(node)
    s.removeListener('readable', onreadable)
    s.removeListener('end', onend)
    s.removeListener('error', onerror)
    s.removeListener('close', onclose)
    self._forward()
  }

  var onreadable = function() {
    self._forward()
  }

  var onclose = function() {
    if (!s._readableState.ended) self.destroy()    
  }

  var onerror = function(err) {
    self.destroy(err)
  }

  s.on('end', onend)
  s.on('readable', onreadable)
  s.on('close', onclose)
  s.on('error', onerror)
}

Parallel.prototype._read = function () {
  this._drained = true
  this._forward()
}

Parallel.prototype._forward = function () {
  if (this._forwarding || !this._drained) return
  this._forwarding = true

  var stream = this._get()
  if (!stream) return

  var chunk
  while ((chunk = stream.read()) !== null) {
    this._current = this._current.next
    this._drained = this.push(chunk)
    stream = this._get()
    if (!stream) return
  }

  this._forwarding = false
}

Parallel.prototype._get = function() {
  var stream = this._current && this._queue.get(this._current)
  if (!stream) this.push(null)
  else return stream
}

Parallel.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  
  var next
  while ((next = this._queue.shift())) {
    if (next.destroy) next.destroy()
  }

  if (err) this.emit('error', err)
  this.emit('close')
}

module.exports = Parallel