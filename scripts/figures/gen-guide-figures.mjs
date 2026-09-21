#!/usr/bin/env node
/**
 * 產生教學文章用的示意圖（public/guides/），產物已進版控，只有要改圖時才需要重跑：
 *
 *   node scripts/figures/gen-guide-figures.mjs
 *
 * 圖裡的 QR Code 都是真的：用 qrcode-generator（qr-code-styling 內建的同一套編碼器）
 * 編出模組矩陣再畫成 SVG，掃得出來，文章裡寫的版本與模組數也是從這裡算出來的
 * （執行時會印出來，改了內容要一併對照文章）。不從網路抓任何圖。
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { deflateSync } from 'node:zlib'

// qrcode-generator 是 qr-code-styling 的相依套件，不是本專案直接宣告的相依，
// 所以從 qr-code-styling 的位置解析，不依賴 npm 把它提升到 node_modules 根目錄。
const require = createRequire(import.meta.url)
const qrcode = createRequire(require.resolve('qr-code-styling'))('qrcode-generator')

const OUT = 'public/guides'
mkdirSync(OUT, { recursive: true })

const INK = '#16130f'
const QUIET = 4

function encode(text, ec) {
  const qr = qrcode(0, ec)
  qr.addData(text, 'Byte')
  qr.make()
  const n = qr.getModuleCount()
  return { n, version: (n - 17) / 4, dark: (r, c) => qr.isDark(r, c) }
}

/** 把一組模組畫成單一 path（每個深色模組一個 1×1 方塊）。 */
function modulesPath(n, pick) {
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (pick(r, c)) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`
  return d
}

function svgDoc(size, body, px, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img"><title>${title}</title><rect width="${size}" height="${size}" fill="#fff"/>${body}</svg>\n`
}

function plainQr(text, ec, px, title) {
  const q = encode(text, ec)
  const size = q.n + QUIET * 2
  return { ...q, svg: svgDoc(size, `<path fill="${INK}" d="${modulesPath(q.n, q.dark)}"/>`, px, title) }
}

const report = {}

// ① 容錯等級：同一個網址，L/M/Q/H 各編一次。
const ecUrl = 'https://www.pocketool.app/qrcode-studio/guide/error-correction/'
for (const ec of ['L', 'M', 'Q', 'H']) {
  const q = plainQr(ecUrl, ec, 240, `容錯等級 ${ec} 的 QR Code`)
  writeFileSync(`${OUT}/ec-${ec.toLowerCase()}.svg`, q.svg)
  report[`ec-${ec}`] = { version: q.version, modules: `${q.n}×${q.n}`, bytes: Buffer.byteLength(ecUrl) }
}

// ② 構造圖：定位圖形、時序圖形、校正圖形、格式資訊分色標出來（版本 3 以上才有校正圖形）。
{
  const text = 'https://www.pocketool.app/qrcode-studio/'
  const q = encode(text, 'M')
  const n = q.n
  const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)
  const inTiming = (r, c) => !inFinder(r, c) && ((r === 6 && c >= 8 && c < n - 8) || (c === 6 && r >= 8 && r < n - 8))
  // 版本 2～6 只有一個校正圖形，中心在 (n-7, n-7)。
  const ac = n - 7
  const inAlign = (r, c) => q.version >= 2 && Math.abs(r - ac) <= 2 && Math.abs(c - ac) <= 2
  const inFormat = (r, c) =>
    (r === 8 && (c <= 8 || c >= n - 8)) || (c === 8 && (r <= 8 || r >= n - 7))
  const layers = [
    ['#FF7A1A', (r, c) => q.dark(r, c) && inFinder(r, c)],
    ['#38BDF8', (r, c) => q.dark(r, c) && inTiming(r, c)],
    ['#1FA971', (r, c) => q.dark(r, c) && inAlign(r, c)],
    ['#FF5DA2', (r, c) => q.dark(r, c) && inFormat(r, c) && !inFinder(r, c) && !inTiming(r, c)],
    [INK, (r, c) => q.dark(r, c) && !inFinder(r, c) && !inTiming(r, c) && !inAlign(r, c) && !inFormat(r, c)],
  ]
  const size = n + QUIET * 2
  const body = layers.map(([fill, pick]) => `<path fill="${fill}" d="${modulesPath(n, pick)}"/>`).join('')
  writeFileSync(`${OUT}/anatomy.svg`, svgDoc(size, body, 280, 'QR Code 構造示意：定位、時序、校正圖形與格式資訊'))
  report.anatomy = { version: q.version, modules: `${n}×${n}`, alignmentCenter: [ac, ac] }
}

// ③ 靜區：QR Code 四周至少 4 個模組寬的空白，用淡黃色標出來。
{
  const text = 'https://www.pocketool.app/qrcode-studio/'
  const q = encode(text, 'M')
  const n = q.n
  const size = n + QUIET * 2
  const band = `<path fill="#FFD12E" fill-opacity=".45" fill-rule="evenodd" d="M0 0h${size}v${size}h-${size}z M${QUIET} ${QUIET}v${n}h${n}v-${n}z"/>`
  // 左邊靜區畫出 4 格模組的分隔線，讓人數得出來。
  let grid = ''
  for (let i = 1; i < QUIET; i++) grid += `M${i} ${QUIET}v${n}`
  const lines = `<path stroke="${INK}" stroke-opacity=".35" stroke-width=".08" d="${grid}"/><rect x="${QUIET}" y="${QUIET}" width="${n}" height="${n}" fill="none" stroke="${INK}" stroke-width=".12" stroke-dasharray=".4 .3"/>`
  writeFileSync(`${OUT}/quiet-zone.svg`,
    svgDoc(size, `${band}<path fill="${INK}" d="${modulesPath(n, q.dark)}"/>${lines}`, 280, 'QR Code 四周的靜區（至少 4 個模組寬）'))
  report.quietZone = { version: q.version, modules: `${n}×${n}` }
}

// ④ 放大比較：同一張 QR Code 的 SVG 版（向量）與 96px 的 PNG 版，在頁面上用同樣尺寸顯示。
{
  const text = 'https://www.pocketool.app/qrcode-studio/guide/qr-code-svg/'
  const q = plainQr(text, 'M', 240, '向量 SVG 版的 QR Code')
  writeFileSync(`${OUT}/upscale-demo.svg`, q.svg)
  writeFileSync(`${OUT}/upscale-demo.png`, smallPng(q, 96))
  report.upscale = { version: q.version, modules: `${q.n}×${q.n}`, png: '96×96' }
}

/**
 * 把同一個矩陣縮成 px×px 的灰階 PNG：每個像素 4×4 超取樣後取平均，模擬一般小尺寸
 * 匯出時模組邊緣被抗鋸齒糊掉的樣子。零依賴（只用 node:zlib）。
 */
function smallPng(q, px) {
  const size = q.n + QUIET * 2
  const ss = 4
  const raw = Buffer.alloc((px + 1) * px)
  for (let y = 0; y < px; y++) {
    raw[y * (px + 1)] = 0 // filter: none
    for (let x = 0; x < px; x++) {
      let dark = 0
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const mr = Math.floor(((y + (sy + 0.5) / ss) / px) * size) - QUIET
        const mc = Math.floor(((x + (sx + 0.5) / ss) / px) * size) - QUIET
        if (mr >= 0 && mc >= 0 && mr < q.n && mc < q.n && q.dark(mr, mc)) dark++
      }
      raw[y * (px + 1) + 1 + x] = Math.round(255 * (1 - dark / (ss * ss)))
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (buf) => {
    let c = 0xffffffff
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type, 'latin1'), data])
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(px, 0); ihdr.writeUInt32BE(px, 4)
  ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0 // 8-bit 灰階
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

console.log(JSON.stringify(report, null, 2))
