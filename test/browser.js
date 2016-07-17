var colorSupport = require('../browser.js')
var t = require('tap')

// t.match() gets confused by functions
t.match(Object.create(colorSupport), {
  level: 0,
  hasBasic: false,
  has256: false,
  has16m: false
})

t.match(colorSupport({ alwaysReturn: true }), {
  level: 0,
  hasBasic: false,
  has256: false,
  has16m: false
})

t.equal(colorSupport(), false)
