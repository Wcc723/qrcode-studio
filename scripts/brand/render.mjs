#!/usr/bin/env node
// 重畫站徽的全套圖示與三張分享圖（public/ 底下，產物進版控）。
//
//   node scripts/brand/render.mjs                  # 全部重畫
//   node scripts/brand/render.mjs og-scan.png      # 只畫指定的幾張（檔名同 public/ 底下的路徑）
//   node scripts/brand/render.mjs --out /tmp/brand # 先畫到別處比對，不覆蓋 public/
//
// 站徽正本（512×512 透明 PNG，Codex 生成，選案與理由見 docs/brand/README.md）：
//   scripts/brand/logo-source.png     頁首、apple-touch-icon、manifest 圖示、分享圖
//   scripts/brand/favicon-source.png  分頁圖示（favicon.svg、favicon.ico）：正本縮到 16px 會糊成一團，改用同一批生成的簡化版
// 圖示一律用 sharp 從正本縮（lanczos3，小尺寸比瀏覽器縮得清楚）。sharp 不是本 repo 的直接相依，是 wrangler 帶進來的。
//
// 分享圖：HTML 模板加 headless Chromium 截圖，字才會精準（不用生圖模型產字）。文字正本在 cards.mjs，
// 站名從 src/config/site.ts 讀，不另外寫一份。標題的中文字型是 Google Fonts 的 Noto Sans TC 900，
// 截圖時要連網；英文與數字用 node_modules 裡的 Fredoka。
// 找 Playwright 的順序：import('playwright')，或環境變數 PLAYWRIGHT_MODULE（某個 playwright 套件目錄的絕對路徑，
// 例如 npx 快取裡那份），必要時再用 PLAYWRIGHT_CHROMIUM 指定瀏覽器執行檔。
//
// 這支不進 build：改了字或正本要自己重跑、目視確認再 commit。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { CARDS, SCAN_QR_TEXT, BARCODE_EAN13 } from './cards.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const PUBLIC = join(ROOT, 'public')
const argv = process.argv.slice(2)
const outAt = argv.indexOf('--out')
const OUT = outAt === -1 ? PUBLIC : argv[outAt + 1]
const only = outAt === -1 ? argv : argv.filter((_a, i) => i !== outAt && i !== outAt + 1)
const wanted = (rel) => !only.length || only.includes(rel)

// 站名的事實來源是 site.ts（TypeScript，Node 不能直接 import），只讀那兩個字串常數
const siteTs = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8')
const siteField = (key) => {
  const m = siteTs.match(new RegExp(`^\\s+${key}: '([^']+)'`, 'm'))
  if (!m) throw new Error(`site.ts 找不到 ${key}`)
  return m[1]
}
const SITE_NAME = siteField('name')
const SITE_NAME_FULL = siteField('siteName')

const LOGO = readFileSync(join(ROOT, 'scripts/brand/logo-source.png'))
const FAVICON = readFileSync(join(ROOT, 'scripts/brand/favicon-source.png'))
// 不透明圖示的底色：頁面的紙色（main.css 的 --paper），跟 manifest 的 background_color 一樣
const PAPER = '#FFF7EA'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

/** 正本縮成 size×size。palette：量化成帶透明的 8-bit 調色盤，給會被每個訪客下載的小圖 */
const mark = (src, size, palette = false) =>
  sharp(src)
    .resize(size, size, { kernel: 'lanczos3' })
    .png(palette ? { palette: true, quality: 90, effort: 10, compressionLevel: 9 } : { compressionLevel: 9 })
    .toBuffer()

/**
 * 不透明的方形圖示：紙色底，站徽佔 ratio。存成不帶 alpha 的 RGB（seo:audit 驗色彩類型是 2）。
 * iOS 與 Android 會自己套圓角或遮罩，所以底色滿版、不留透明角，也不自己畫圓角。
 */
async function opaqueIcon(size, ratio) {
  return sharp({ create: { width: size, height: size, channels: 3, background: PAPER } })
    .composite([{ input: await mark(LOGO, Math.round(size * ratio)), gravity: 'centre' }])
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/** ICO 就是「6 byte 檔頭 + 每張 16 byte 目錄項 + 各張 PNG 原封不動接在後面」，不必裝相依 */
function packIco(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = header.length
  pngs.forEach(({ size, png }, i) => {
    const at = 6 + 16 * i
    header.writeUInt8(size >= 256 ? 0 : size, at)
    header.writeUInt8(size >= 256 ? 0 : size, at + 1)
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(png.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...pngs.map((p) => p.png)])
}

/**
 * 站徽的全部輸出。各用途內嵌的尺寸不同是為了控制檔案大小：favicon.svg 每個訪客都會下載，
 * 只內嵌 96px 的調色盤 PNG（照口袋工具 hub 與英文跟讀的做法：SVG 外框包點陣圖）。
 */
const ICONS = {
  // 頁首 32px 顯示，2x／3x（DefaultLayout.vue 的 srcset）
  'logo-64.png': () => mark(LOGO, 64, true),
  'logo-96.png': () => mark(LOGO, 96, true),
  // 分頁圖示。不加底色：橘色方徽在淺色與深色分頁列上都看得見
  'favicon.svg': async () =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${esc(SITE_NAME)}">` +
        `<image width="64" height="64" href="data:image/png;base64,${(await mark(FAVICON, 96, true)).toString('base64')}"/></svg>\n`,
    ),
  'favicon.ico': async () => packIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await mark(FAVICON, size) })))),
  // iOS 加入主畫面：180×180、不透明；站徽四周留約 19px
  'apple-touch-icon.png': () => opaqueIcon(180, 142 / 180),
  // manifest（any maskable）：站徽縮在中央 60%，被遮成圓形也切不到
  'icon-192.png': () => opaqueIcon(192, 0.6),
  'icon-512.png': () => opaqueIcon(512, 0.6),
}

// ───────────────────────── 分享圖 ─────────────────────────

const require = createRequire(import.meta.url)
async function loadChromium() {
  try {
    return (await import('playwright')).chromium
  } catch {
    const dir = process.env.PLAYWRIGHT_MODULE
    if (!dir) throw new Error('找不到 Playwright：`npm i --no-save playwright`，或設 PLAYWRIGHT_MODULE=<playwright 套件目錄>')
    return createRequire(join(dir, 'package.json'))(dir).chromium
  }
}

const dataUri = (buf, type = 'image/png') => `data:${type};base64,${buf.toString('base64')}`
const FREDOKA = dataUri(readFileSync(require.resolve('@fontsource/fredoka/files/fredoka-latin-700-normal.woff2')), 'font/woff2')

async function barcodeSvg(text, format) {
  const { writeBarcode, prepareZXingModule } = await import('zxing-wasm/writer')
  prepareZXingModule({
    overrides: { wasmBinary: readFileSync(join(ROOT, 'node_modules/zxing-wasm/dist/writer/zxing_writer.wasm')).buffer },
  })
  const res = await writeBarcode(text, { format, withQuietZones: false })
  if (res.error) throw new Error(`${format}：${res.error}`)
  // zint 的 SVG 只有固定的 width／height，改成 viewBox 才會跟著外框縮放；一維條碼可以只拉高不拉寬
  const fit = format === 'QRCode' ? 'xMidYMid meet' : 'none'
  return res.svg
    .replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg width="(\d+)" height="(\d+)"/, `<svg viewBox="0 0 $1 $2" preserveAspectRatio="${fit}" shape-rendering="crispEdges"`)
}

async function artHtml(art) {
  if (art === 'logo') {
    return `<div class="art-logo"><img src="${dataUri(LOGO)}" alt=""></div>`
  }
  if (art === 'scan') {
    const qr = await barcodeSvg(SCAN_QR_TEXT, 'QRCode')
    return `<div class="art-card"><span class="tag">截圖</span><div class="dash"><div class="qr">${qr}</div><div class="beam"></div></div></div>`
  }
  const bars = await barcodeSvg(BARCODE_EAN13, 'EAN13')
  return `<div class="art-card"><span class="tag tag-sun">EAN-13</span><div class="ean"><div class="bars">${bars}</div><div class="digits">${BARCODE_EAN13}</div></div></div>`
}

async function cardHtml(card) {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700;900&display=block">
<style>
  @font-face { font-family: Fredoka; src: url(${FREDOKA}) format('woff2'); font-weight: 700; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: #16130f;
    font-family: Fredoka, 'Noto Sans TC', sans-serif; font-weight: 700; -webkit-font-smoothing: antialiased;
    background-color: #C9F2E1;
    background-image: radial-gradient(rgb(22 19 15 / 9%) 2px, transparent 2.2px); background-size: 28px 28px; }
  .dot { position: absolute; border-radius: 50%; border: 4px solid #16130f; }
  .spark { position: absolute; width: 56px; height: 56px; background: #FFD12E;
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); }
  .spark::after { content: ''; position: absolute; inset: 0; }
  .chip { position: absolute; left: 70px; top: 62px; height: 66px; display: flex; align-items: center; gap: 12px;
    padding: 0 26px 0 10px; background: #fff; border: 4px solid #16130f; border-radius: 999px;
    box-shadow: 5px 5px 0 #16130f; font-size: 27px; }
  .chip img { width: 50px; height: 50px; }
  .title { position: absolute; left: 66px; top: 160px; font-size: 104px; line-height: 1.12; font-weight: 900;
    letter-spacing: 2px; white-space: nowrap; }
  .title span { display: block; -webkit-text-stroke: 12px #16130f; paint-order: stroke fill; text-shadow: 7px 7px 0 #16130f; }
  .title .sun { color: #FFD12E; } .title .pink { color: #FF5DA2; }
  .banner { position: absolute; left: 70px; top: 424px; height: 70px; display: flex; align-items: center; padding: 0 30px;
    background: #FF5DA2; color: #fff; border: 4px solid #16130f; border-radius: 18px; box-shadow: 6px 6px 0 #16130f;
    font-size: 32px; font-weight: 900; white-space: nowrap; }
  .chips { position: absolute; left: 70px; top: 526px; display: flex; gap: 14px; }
  .chips span { height: 54px; display: flex; align-items: center; padding: 0 20px; background: #fff; border: 3px solid #16130f;
    border-radius: 14px; box-shadow: 4px 4px 0 #16130f; font-size: 25px; white-space: nowrap; }
  .art-logo { position: absolute; left: 736px; top: 124px; width: 400px; height: 400px; transform: rotate(-4deg);
    filter: drop-shadow(10px 12px 0 rgb(22 19 15 / 18%)); }
  .art-logo img { width: 100%; height: 100%; }
  .art-card { position: absolute; left: 726px; top: 104px; width: 410px; height: 410px; transform: rotate(4deg);
    background: #fff; border: 5px solid #16130f; border-radius: 34px; box-shadow: 10px 10px 0 #16130f;
    display: flex; align-items: center; justify-content: center; }
  .tag { position: absolute; left: 24px; top: -26px; height: 52px; display: flex; align-items: center; padding: 0 18px;
    background: #38BDF8; border: 4px solid #16130f; border-radius: 12px; box-shadow: 4px 4px 0 #16130f; font-size: 26px;
    transform: rotate(-6deg); }
  .tag-sun { left: auto; right: 22px; background: #FFD12E; transform: rotate(8deg); }
  .dash { position: relative; width: 322px; height: 322px; border: 4px dashed #16130f; border-radius: 20px; background: #FFF7EA;
    display: flex; align-items: center; justify-content: center; }
  .qr { width: 262px; height: 262px; background: #fff; padding: 14px; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .beam { position: absolute; left: 12px; right: 12px; top: 150px; height: 12px; border-radius: 6px; background: #FF7A1A;
    border: 3px solid #16130f; }
  .ean { width: 330px; display: flex; flex-direction: column; align-items: center; }
  .bars { width: 300px; height: 170px; }
  .bars svg { width: 100%; height: 100%; display: block; }
  .digits { margin-top: 10px; font-family: ui-monospace, Menlo, monospace; font-size: 30px; letter-spacing: 5px; }
</style></head><body>
  <div class="dot" style="left:640px;top:36px;width:62px;height:62px;background:#FFD12E"></div>
  <div class="dot" style="left:-70px;top:520px;width:170px;height:170px;background:#FF5DA2"></div>
  <div class="dot" style="left:1102px;top:548px;width:180px;height:180px;background:#36D399"></div>
  <div class="dot" style="left:602px;top:530px;width:34px;height:34px;background:#38BDF8"></div>
  <div class="spark" style="left:640px;top:452px"></div>
  ${await artHtml(card.art)}
  <div class="chip"><img src="${dataUri(await mark(LOGO, 100))}" alt="">${esc(SITE_NAME_FULL)}</div>
  <div class="title">${card.lines.map((l) => `<span class="${l.color}">${esc(l.text)}</span>`).join('')}</div>
  <div class="banner">${esc(card.banner)}</div>
  <div class="chips">${card.chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
</body></html>`
}

function write(rel, buf) {
  const file = join(OUT, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, buf)
  console.log(`[brand] ${rel}（${(buf.length / 1024).toFixed(1)} KB）`)
}

for (const [rel, make] of Object.entries(ICONS)) {
  if (wanted(rel)) write(rel, await make())
}

const cards = CARDS.filter((c) => wanted(c.out))
if (cards.length) {
  const chromium = await loadChromium()
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined })
  // 2 倍解析度截圖再縮回原尺寸，字的邊緣比 1 倍截圖乾淨
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
  for (const card of cards) {
    await page.setContent(await cardHtml(card), { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    // 字型依 unicode-range 分片載入，只檢查這張圖上真的有的漢字（英數字先用 Fredoka，Noto 那幾片不會載）
    const text = [...card.lines.map((l) => l.text), card.banner, ...card.chips].join('').replace(/[^\p{Script=Han}]/gu, '')
    const ok = await page.evaluate((t) => document.fonts.check('900 104px "Noto Sans TC"', t), text)
    if (!ok) throw new Error('Noto Sans TC 沒載到（要連網），不要用後備字型產圖')
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
    write(card.out, await sharp(png).resize(1200, 630, { kernel: 'lanczos3' }).png({ palette: true, colours: 256, effort: 10 }).toBuffer())
  }
  await browser.close()
}
console.log(`[brand] 站名：${SITE_NAME}（${SITE_NAME_FULL}）`)
