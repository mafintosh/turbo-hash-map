const HashMap = require('./')
const brittle = require('brittle')

brittle('big map', function (t) {
  const m = new HashMap()

  const expected = []

  for (let i = 0; i < 10000; i++) {
    const pair = [hash('#' + i), '#' + i]
    expected.push(pair)
    m.set(pair[0], pair[1])
  }

  const sort = (a, b) => cmp(a[0].toString('hex'), b[0].toString('hex'))

  expected.sort(sort)

  t.is(m.size, expected.length)

  const entries = [...m].sort(sort)

  t.alike(entries, expected)

  let same = 0
  for (const [k, v] of expected) {
    if (m.get(k) !== v) {
      t.fail('unexpected value')
    } else {
      same++
    }
  }

  t.is(same, expected.length)

  same = 0
  for (const [k] of expected) {
    if (!m.has(k)) {
      t.fail('unexpected value')
    } else {
      same++
    }
  }

  t.is(same, expected.length)

  const keys = [...m.keys()].map(a => a.toString('hex')).sort(cmp)
  const expectedKeys = expected.map(a => a[0].toString('hex')).sort(cmp)
  t.alike(keys, expectedKeys)

  const values = [...m.values()].sort(cmp)
  const expectedValues = expected.map(a => a[1]).sort(cmp)
  t.alike(values, expectedValues)

  m.delete(hash('#32'))

  t.is(m.size, expected.length - 1)
  t.not(m.has(hash('#32')))
})

brittle('auto flattens on delete', function (t) {
  const m = new HashMap()

  m.set(hash('a'), 'a')
  m.set(hash('b'), 'b')

  m.delete(hash('a'))

  t.ok(m.trie.key, 'flattened the trie')
  t.is(m.size, 1)

  m.clear()

  t.not(m.trie, 'no more trie')
  t.is(m.size, 0)
})

function hash (k) {
  return require('crypto').createHash('sha256').update(k).digest()
}

function cmp (a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}
