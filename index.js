class Trie {
  constructor (byte, density, key, value) {
    this.byte = byte
    this.density = density
    this.key = key
    this.value = value
    this.next = null
  }

  * list () {
    if (this.key !== null) {
      yield this
      return
    }

    for (let i = 0; i < this.next.length; i++) {
      const n = this.next[i]
      if (n !== undefined) yield * n.list()
    }
  }

  split (hash, i) {
    const byte = hash[i]

    const t = new Trie(this.key[i], this.density, this.key, this.value)

    this.key = null
    this.value = null

    if (byte === t.byte) {
      this.next = new Array(1)
      this.next[0] = t
      this.density = 1
      return t
    }

    const n = new Trie(byte, 0, hash, null)
    const b = branch(1, byte, t.byte)
    const mask = b - 1

    this.next = new Array(b)
    this.next[t.byte & mask] = t
    this.next[byte & mask] = n
    this.density = 2

    return n
  }

  remove (byte) {
    const mask = this.next.length - 1

    this.next[byte & mask] = undefined
    this.density--

    if (this.density === 1) {
      for (let i = 0; i < this.next.length; i++) {
        const n = this.next[i]
        if (n === undefined) continue
        this.key = n.key
        this.value = n.value
        this.next = null
        return
      }
    }
  }

  get (hash, i, upsert) {
    const byte = hash[i]

    let mask = this.next.length - 1
    const bm = byte & mask
    let n = this.next[bm]

    if (n === undefined) {
      if (upsert === false) return null
      this.density++
      return (this.next[bm] = new Trie(byte, 0, hash, null))
    }

    if (n.byte === byte) return n
    if (upsert === false) return null

    const b = branch(this.next.length, byte, n.byte)
    const next = new Array(b)

    mask = next.length - 1
    n = new Trie(byte, 0, hash, null)
    next[byte & mask] = n

    for (let i = 0; i < this.next.length; i++) {
      const o = this.next[i]
      if (o !== undefined) next[o.byte & mask] = o
    }

    this.density++
    this.next = next
    return n
  }
}

module.exports = class HashMap {
  constructor () {
    this.trie = null
    this.size = 0
  }

  * [Symbol.iterator] () {
    if (this.trie === null) return
    for (const t of this.trie.list()) {
      yield [t.key, t.value]
    }
  }

  * keys () {
    if (this.trie === null) return
    for (const t of this.trie.list()) {
      yield t.key
    }
  }

  * values () {
    if (this.trie === null) return
    for (const t of this.trie.list()) {
      yield t.value
    }
  }

  get (hash) {
    let t = this.trie

    if (t === null) return undefined

    for (let i = 0; i < hash.byteLength; i++) {
      if (t.key === null) {
        t = t.get(hash, i, false)
        if (t === null) return undefined
        continue
      }

      return t.key.equals(hash) ? t.value : undefined
    }

    return undefined
  }

  has (hash) {
    let t = this.trie

    if (t === null) return false

    for (let i = 0; i < hash.byteLength; i++) {
      if (t.key === null) {
        t = t.get(hash, i, false)
        if (t === null) return null
        continue
      }

      return t.key.equals(hash)
    }

    return false
  }

  set (hash, value) {
    let t = this.trie

    if (t === null) {
      this.trie = new Trie(0, 1, hash, value)
      this.size = 1
      return
    }

    for (let i = 0; i < hash.byteLength; i++) {
      if (t.key === null) {
        t = t.get(hash, i, true)
        continue
      }
      if (t.key.equals(hash)) {
        if (t.density === 0) {
          t.density = 1
          this.size++
        }
        t.value = value
        return
      }

      t = t.split(hash, i)
    }
  }

  delete (hash) {
    let t = this.trie

    if (t === null) return false

    const trace = []

    for (let i = 0; i < hash.byteLength; i++) {
      trace.push(t)
      if (t.key === null) {
        t = t.get(hash, i, false)
        if (t === null) return false
      } else {
        if (t.key.equals(hash)) {
          t.density = 0
          this.size--
        }
        break
      }
    }

    let removed = trace.pop()

    while (trace.length > 0 && removed.density === 0) {
      const t = trace.pop()
      t.remove(removed.byte)
      removed = t
    }

    if (this.trie.density === 0) this.trie = null
    return true
  }

  clear () {
    this.size = 0
    this.trie = null
  }
}

function branch (f, a, b) {
  while ((a & f) === (b & f)) f *= 2
  return f * 2
}
