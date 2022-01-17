const HashMap = require('./')

const h = new HashMap()
const s = new Map()

const size = 50000
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

console.time('turbo-hash-map-set')
for (let i = 0; i < 1000; i++) {
  for (const k of ls()) {
    h.set(k, k)
  }
}
console.timeEnd('turbo-hash-map-set')

console.time('turbo-hash-map-get')
for (let i = 0; i < 1000; i++) {
  for (const k of ls()) {
    h.get(k)
  }
}
console.timeEnd('turbo-hash-map-get')

console.time('js-map-set')
for (let i = 0; i < 1000; i++) {
  for (const k of ls()) {
    s.set(k.toString('hex'), k)
  }
}
console.timeEnd('js-map-set')

console.time('js-map-get')
for (let i = 0; i < 1000; i++) {
  for (const k of ls()) {
    s.get(k.toString('hex'))
  }
}
console.timeEnd('js-map-get')

function hash (k) {
  return require('crypto').createHash('sha256').update(k).digest()
}
