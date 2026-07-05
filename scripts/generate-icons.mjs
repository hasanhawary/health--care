// Renders PNG PWA icons (any + maskable) and an Apple touch icon from the SVG
// favicon. Run with: npm run icons
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = join(__dirname, '..', 'public')
const iconsDir = join(pub, 'icons')
mkdirSync(iconsDir, { recursive: true })

const svg = readFileSync(join(pub, 'favicon.svg'))

// Maskable variant: full-bleed gradient background (no rounded corners) with the
// glyph scaled to 80% so it stays inside the maskable safe zone on Android.
const maskableSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f86f5"/><stop offset="1" stop-color="#1751b0"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(51.2 51.2) scale(0.8)">
    <path d="M256 392c-8 0-16-3-22-9l-104-104c-26-26-26-69 0-95 26-26 68-26 94 0l32 32 32-32c26-26 68-26 94 0 26 26 26 69 0 95L278 383c-6 6-14 9-22 9z" fill="#fff" opacity="0.95"/>
    <path d="M150 268h34l20-44 30 84 26-62 18 22h54" fill="none" stroke="#2f86f5" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`
)

async function render(buf, size, out) {
  await sharp(buf, { density: 384 }).resize(size, size).png().toFile(out)
  console.log('✓', out.split('/').slice(-2).join('/'), size + 'x' + size)
}

await render(svg, 192, join(iconsDir, 'icon-192.png'))
await render(svg, 512, join(iconsDir, 'icon-512.png'))
await render(maskableSvg, 192, join(iconsDir, 'icon-maskable-192.png'))
await render(maskableSvg, 512, join(iconsDir, 'icon-maskable-512.png'))
await render(maskableSvg, 180, join(pub, 'apple-touch-icon.png'))
console.log('Icons generated in', iconsDir)
