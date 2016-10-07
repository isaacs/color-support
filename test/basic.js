var t = require('tap')
var colorSupport = require('../')

var hasNone = {
  level: 0,
  hasBasic: false,
  has256: false,
  has16m: false
}

var hasBasic = {
  level: 1,
  hasBasic: true,
  has256: false,
  has16m: false
}

var has256 = {
  level: 2,
  hasBasic: true,
  has256: true,
  has16m: false
}

var has16m = {
  level: 3,
  hasBasic: true,
  has256: true,
  has16m: true
}

t.test('set fields on top level', function (t) {
  t.match(colorSupport.level, Number)
  t.match(colorSupport.hasBasic, Boolean)
  t.match(colorSupport.has256, Boolean)
  t.match(colorSupport.has16m, Boolean)

  // flags on object match what you get calling it with no opts
  // t.match() gets confused by functions, and we need to ensure that
  // *something* gets returned when colors are unsupported
  t.match(Object.create(colorSupport), colorSupport({ alwaysReturn: true }))
  t.end()
})

t.test('non-node = no colors', function (t) {
  var p = process.env
  process.env = null
  t.notOk(colorSupport())
  process.env = p
  t.end()
})

t.test('colors depend on being a tty', function (t) {
  var notty = { isTTY: false }
  t.notOk(colorSupport({ stream: notty }))

  // if we ignore the tty, it's the same either way tho
  t.same(colorSupport({
    stream: notty,
    ignoreTTY: true
  }), colorSupport({ ignoreTTY: true }))

  // or if it is a tty, same as ignoring it
  t.same(colorSupport({
    stream: { isTTY: true }
  }), colorSupport({ ignoreTTY: true }))

  t.end()
})

t.test('TERM=dumb', function (t) {
  t.notOk(colorSupport({ term: 'dumb', ignoreTTY: true }))

  t.same(colorSupport({
    term: 'dumb',
    ignoreTTY: true,
    ignoreDumb: true
  }), colorSupport({ ignoreTTY: true }))

  // with COLORTERM set, term=dumb is ignored
  t.same(colorSupport({
    term: 'dumb',
    ignoreTTY: true,
    alwaysReturn: true,
    env: {
      COLORTERM: 'yolo'
    }
  }), colorSupport({
    ignoreTTY: true,
    alwaysReturn: true,
    env: {
      COLORTERM:'yolo'
    }
  }))
  t.end()
})

t.test('win32', function (t) {
  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'win32'
  }), hasBasic)
  t.end()
})

t.test('tmux', function (t) {
  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'linux',
    env: { TMUX: 'some junk' }
  }), has256)
  t.end()
})

t.test('TERM_PROGRAM', function (t) {
  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {
      TERM_PROGRAM: 'iTerm.app'
    }
  }), has256)

  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {
      TERM_PROGRAM: 'Hyper',
      TERM_PROGRAM_VERSION: '0.8.9'
    }
  }), has16m)

  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {
      TERM_PROGRAM: 'HyperTerm',
      TERM_PROGRAM_VERSION: '0.7.0'
    }
  }), has16m)

  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {
      TERM_PROGRAM: 'iTerm.app',
      TERM_PROGRAM_VERSION: '3.0.4'
    }
  }), has16m)

  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {
      TERM_PROGRAM: 'MacTerm'
    }
  }), has16m)

  t.same(colorSupport({
    ignoreTTY: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {
      TERM_PROGRAM: 'Apple_Terminal'
    }
  }), has256)

  t.end()
})

t.test('colors on CI servers', function (t) {
  var options = {
    ignoreTTY: true,
    alwaysReturn: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {
      CI: '1'
    }
  }
  t.same(colorSupport(options), hasNone)
  options.env.TRAVIS = '1'
  t.same(colorSupport(options), has256)
  options.env = { TEAMCITY_VERSION: '1' }
  t.same(colorSupport(options), hasNone)

  options.ignoreCI = true
  t.same(colorSupport(options), colorSupport({
    ignoreTTY: true,
    alwaysReturn: true,
    ignoreDumb: true,
    platform: 'darwin',
    env: {}
  }))
  t.end()
})

t.test('TERM=stuff', function (t) {
  var options = {
    ignoreTTY: true,
    alwaysReturn: true,
    ignoreDumb: true,
    platform: 'definitely not windows',
    env: {}
  }

  options.term = 'xterm-256etc'
  t.same(colorSupport(options), has256)

  options.term = 'screen that is blue, of death'
  t.same(colorSupport(options), hasBasic)

  options.term = 'xterm-something else'
  t.same(colorSupport(options), hasBasic)

  options.term = 'vt100 and 1 dalmations'
  t.same(colorSupport(options), hasBasic)

  options.term = 'are we human or are we dansir'
  t.same(colorSupport(options), hasBasic)

  options.term = 'check out dat linux, gpl af'
  t.same(colorSupport(options), hasBasic)

  t.end()
})

t.test('env.COLORTERM makes it basic at least', function (t) {
  var options = {
    ignoreTTY: true,
    alwaysReturn: true,
    ignoreDumb: true,
    platform: 'definitely not windows',
    env: { COLORTERM: 'yeah whatever' }
  }

  t.same(colorSupport(options), hasBasic)

  t.end()
})

t.test('mutates an object passed in', function (t) {
  var obj = { level: 'up' }
  colorSupport({}, obj)
  t.match(obj.level, Number)
  t.end()
})

t.test('getting a specific level', function (t) {
  t.match(colorSupport({ level: 0, alwaysReturn: true }), hasNone)
  t.notOk(colorSupport({ level: 0 }))
  t.match(colorSupport({ level: 1 }), hasBasic)
  t.match(colorSupport({ level: 2 }), has256)
  t.match(colorSupport({ level: 3 }), has16m)
  t.match(colorSupport({ level: 4 }), colorSupport())
  t.end()
})
