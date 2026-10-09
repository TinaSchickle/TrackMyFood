// Erzeugt einfache PNG-Icons (grüner Grund, weißer Teller mit Gabel-Andeutung)
// ohne externe Abhängigkeiten. Aufruf: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, maskable) {
  const bg = [0x4f, 0x8a, 0x6b], fg = [255, 255, 255], rim = [0xd6, 0xe8, 0xdd]
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const cx = size / 2
  const plate = size * (maskable ? 0.27 : 0.34)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx + 0.5, y - cx + 0.5)
      let col = bg
      if (d < plate) col = fg
      else if (d < plate * 1.18) col = rim
      if (d < plate * 0.62 && d > plate * 0.55) col = rim
      let a = 255
      if (!maskable) { // abgerundete Ecken
        const r = size * 0.22
        const dx = Math.max(r - x, 0, x - (size - 1 - r))
        const dy = Math.max(r - y, 0, y - (size - 1 - r))
        if (Math.hypot(dx, dy) > r) a = 0
      }
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = col[0]; raw[i + 1] = col[1]; raw[i + 2] = col[2]; raw[i + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}
writeFileSync('public/icons/icon-192.png', png(192, false))
writeFileSync('public/icons/icon-512.png', png(512, false))
writeFileSync('public/icons/icon-maskable-512.png', png(512, true))
console.log('Icons erzeugt')
