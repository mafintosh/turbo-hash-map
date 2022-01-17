
const bench = require('fastbench')
const HashMap = require('../')

const h = new HashMap()
const s = new Map()

const size = 500000
const keys = []

while (keys.length < size) {
  keys.push(hash('#' + keys.length))
}

const ls = process.argv[2] === 'copy' ? copy : noCopy

function noCopy () {
  return keys
}

function copy (list) {
  const l = new Array(list.length)
  for (let i = 0; i < list.length; i++) {
    l[i] = Buffer.allocUnsafe(32)
    list[i].copy(l[i])
  }
  return l
}

const noop = () => {}

const run = bench([
  function turboHashMapSet (cb) {
    for (const k of ls()) {
      h.set(k, k)
    }
    setImmediate(cb)
  },
  function turboHashMapGet (cb) {
    for (const k of ls()) {
      h.get(k)
    }
    setImmediate(cb)
  },
  function turboHashMapIterate (cb) {
    for (const [k] of h) {
      noop(k[Math.round(Math.random() * 4)]) // prevent dead-code removal optimization
    }
    setImmediate(cb)
  },
  function jsMapSet (cb) {
    for (const k of ls()) {
      s.set(k.toString('hex'), k)
    }
    setImmediate(cb)
  },
  function jsMapGet (cb) {
    for (const k of ls()) {
      s.get(k.toString('hex'))
    }
    setImmediate(cb)
  },
  function jsMapIterate (cb) {
    for (const [k] of s) {
      noop(k[Math.random(Math.random() * 4)]) // prevent dead-code removal optimization
    }
    setImmediate(cb)
  }
], 1000)

run(run)

function hash (k) {
  return require('crypto').createHash('sha256').update(k).digest()
}
