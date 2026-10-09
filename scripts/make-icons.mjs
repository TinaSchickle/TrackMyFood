// Erzeugt App-Icons und das Start-Logo aus assets/logo-source.jpg.
// Aufruf: node scripts/make-icons.mjs
import sharp from 'sharp'

const src = 'assets/logo-source.jpg'
const white = { r: 255, g: 255, b: 255, alpha: 1 }

// Nur das Bildzeichen (Blatt, Herz, Gabel, Pfeil) – Text wäre im Icon unleserlich.
const MARK_W = 340
const MARK_H = 272
const mark = await sharp(src)
  .extract({ left: 558, top: 150, width: MARK_W, height: MARK_H })
  .toBuffer()

async function icon(file, size, fill) {
  const w = Math.round(size * fill)
  const h = Math.round((w * MARK_H) / MARK_W)
  const m = await sharp(mark).resize(w, h).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: white } })
    .composite([{ input: m, left: Math.floor((size - w) / 2), top: Math.floor((size - h) / 2) }])
    .png()
    .toFile(file)
}

await icon('public/icons/icon-192.png', 192, 0.86)
await icon('public/icons/icon-512.png', 512, 0.86)
await icon('public/icons/icon-maskable-512.png', 512, 0.62) // Sicherheitsrand für runde Masken

// Vollständiges Logo als Kreis (transparent außerhalb) für den Startscreen
const R = 328
const S = 480
const circle = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="#fff"/></svg>`
)
const logo = await sharp(src)
  .extract({ left: 704 - R, top: 384 - R, width: 2 * R, height: 2 * R })
  .resize(S, S)
  .ensureAlpha()
  .png()
  .toBuffer()
await sharp(logo)
  .composite([{ input: await sharp(circle).png().toBuffer(), blend: 'dest-in' }])
  .png()
  .toFile('public/icons/logo.png')
console.log('Icons und Logo erzeugt')
