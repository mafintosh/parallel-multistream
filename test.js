var tape = require('tape')
var from = require('from2-array')
var concat = require('concat-stream')
var parallel = require('./')

tape('single stream', function(t) {
  var s = from.obj(['a1', 'a2', 'a3'])

  parallel.obj([s])
    .pipe(concat({encoding:'object'}, function(list) {
      t.same(list, ['a1', 'a2', 'a3'], 'same output')
      t.end()
    }))
})

tape('parallel output', function(t) {
  var s1 = from.obj(['a1', 'a2', 'a3'])
  var s2 = from.obj(['b1', 'b2', 'b3'])

  parallel.obj([s1, s2])
    .pipe(concat({encoding:'object'}, function(list) {
      t.same(list, ['a1', 'b1', 'a2', 'b2', 'a3', 'b3'], 'parallel output')
      t.end()
    }))
})

tape('parallel output unequal length', function(t) {
  var s1 = from.obj(['a1', 'a2', 'a3'])
  var s2 = from.obj(['b1', 'b2', 'b3', 'b4', 'b5'])
  var s3 = from.obj(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])

  parallel.obj([s1, s2, s3])
    .pipe(concat({encoding:'object'}, function(list) {
      t.same(list, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3', 'b4', 'c4', 'b5', 'c5', 'c6', 'c7'], 'parallel output')
      t.end()
    }))
})

tape('destroyable', function(t) {
  t.plan(4)

  var s1 = from.obj(['a1', 'a2', 'a3'])
  var s2 = from.obj(['b1', 'b2', 'b3', 'b4', 'b5'])
  var s3 = from.obj(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])

  var p = parallel.obj([s1, s2, s3])

  s1.once('close', function() {
    t.ok(true, 's1 closed')
  })

  s2.once('close', function() {
    t.ok(true, 's2 closed')
  })

  s3.once('close', function() {
    t.ok(true, 's3 closed')
  })

  p.once('close', function() {
    t.ok(true, 'parallel closed')
  })

  p.destroy()
})