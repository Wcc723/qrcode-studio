#!/usr/bin/env node
// 重畫站徽的全套圖示與分享圖（public/ 底下，產物進版控）。
//
//   node scripts/brand/render.mjs                  # 全部重畫
//   node scripts/brand/render.mjs og-scan.png      # 只畫指定的幾張（檔名同 public/ 底下的路徑）
//   node scripts/brand/render.mjs --out /tmp/brand # 先畫到別處比對，不覆蓋 public/
//
// 站徽正本（512×512 透明 PNG，Codex 生成，選案與理由見 docs/brand/README.md）：
//   scripts/brand/logo-source.png     頁首、apple-touch-icon、manifest 圖示（any 與 maskable）、分享圖
//   scripts/brand/favicon-source.png  分頁圖示（favicon.svg、favicon.ico）：正本縮到 16px 會糊成一團，改用同一批生成的簡化版
// 圖示一律用 sharp 從正本縮（lanczos3，小尺寸比瀏覽器縮得清楚）。sharp 不是本 repo 的直接相依，是 wrangler 帶進來的。
//
// 分享圖：HTML 模板加 headless Chromium 截圖，字才會精準（不用生圖模型產字）。文字正本在 cards.mjs，
// 站名與網址從 src/config/site.ts 讀，不另外寫一份。標題的中文字型是 Google Fonts 的 Noto Sans TC 900，
// 截圖時要連網；英文與數字用 node_modules 裡的 Fredoka。
// 每張產完會自己檢查兩件事，不過就停：字有沒有超出左半邊撞到右邊的圖（換字或換字級後最常出事），
// 以及圖裡的碼用站上同一版解碼器（zxing-wasm 的 reader）讀不讀得出來、內容對不對。
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
// 正式網址（含子路徑、無尾斜線）：教學分享圖裡的 QR Code 內容是它接上 cards.mjs 的 qr
const SITE_URL = siteField('url')
const SITE_NAME_FULL = siteField('siteName')
const SITE_NAME_EN_FULL = siteField('siteNameEn')

const LOGO = readFileSync(join(ROOT, 'scripts/brand/logo-source.png'))
const FAVICON = readFileSync(join(ROOT, 'scripts/brand/favicon-source.png'))
// 不透明圖示的底色：頁面的紙色（main.css 的 --paper），跟 manifest 的 background_color 一樣
const PAPER = '#FFF7EA'

// maskable 的安全圓：Android 會把圖示裁成圓形、方圓形或水滴形，只保證以中心為圓心、半徑為寬度 40% 的圓不被切到
// （W3C Manifest 的 safe zone，seo:audit 逐像素驗）。站徽縮到「最遠的非透明像素」落在 39% 內，留 1% 給縮圖的反鋸齒。
const SAFE_RADIUS = 0.39
// 正本裡最遠的非透明像素（取像素離中心最遠的那一角）到中心的距離，以正本寬度為 1。正本換了會跟著變，不寫死。
const LOGO_REACH = await (async () => {
  const { data, info } = await sharp(LOGO).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  let far = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!data[(y * w + x) * 4 + 3]) continue
      const dx = Math.max(Math.abs(x - w / 2), Math.abs(x + 1 - w / 2))
      const dy = Math.max(Math.abs(y - h / 2), Math.abs(y + 1 - h / 2))
      far = Math.max(far, Math.hypot(dx, dy))
    }
  }
  return far / w
})()

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

/**
 * 正本縮成 size×size。palette：量化成帶透明的 8-bit 調色盤，給頁首站徽這種每個訪客都會下載的小圖，
 * 以及 manifest 的 any 圖示（512 從約 256 KB 降到約 60 KB，與原圖的 PSNR 約 45 dB，主畫面大小看不出差別）。
 */
const mark = (src, size, palette = false) =>
  sharp(src)
    .resize(size, size, { kernel: 'lanczos3' })
    .png(palette ? { palette: true, quality: 90, effort: 10, compressionLevel: 9 } : { compressionLevel: 9 })
    .toBuffer()

/**
 * 不透明的方形圖示：紙色底，站徽邊長 side。存成不帶 alpha 的 RGB（seo:audit 驗色彩類型是 2）。
 * iOS 與 Android 會自己套圓角或遮罩，所以底色滿版、不留透明角，也不自己畫圓角。
 */
async function opaqueIcon(size, side) {
  return sharp({ create: { width: size, height: size, channels: 3, background: PAPER } })
    .composite([{ input: await mark(LOGO, side), gravity: 'centre' }])
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/** manifest 的 maskable：站徽盡量大，但整個落在安全圓內。邊長取偶數，置中時四周留白一樣、不差半個像素 */
const maskableIcon = (size) => opaqueIcon(size, 2 * Math.floor((size * SAFE_RADIUS) / LOGO_REACH / 2))

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
  'apple-touch-icon.png': () => opaqueIcon(180, 142),
  // manifest 的 any：站徽本身、透明底（跟頁首與分頁圖示一樣），桌面安裝後的視窗與工作列照原樣顯示
  'icon-192.png': () => mark(LOGO, 192, true),
  'icon-512.png': () => mark(LOGO, 512, true),
  // manifest 的 maskable：紙色滿版底，站徽縮在安全圓內，Android 主畫面裁成什麼形狀都切不到
  'icon-maskable-192.png': () => maskableIcon(192),
  'icon-maskable-512.png': () => maskableIcon(512),
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

/** options 是 zxing 的寫入選項字串，例如 'ecLevel=H'（QR Code 的容錯等級） */
async function barcodeSvg(text, format, options = '') {
  const { writeBarcode, prepareZXingModule } = await import('zxing-wasm/writer')
  prepareZXingModule({
    overrides: { wasmBinary: readFileSync(join(ROOT, 'node_modules/zxing-wasm/dist/writer/zxing_writer.wasm')).buffer },
  })
  const res = await writeBarcode(text, { format, withQuietZones: false, ...(options ? { options } : {}) })
  if (res.error) throw new Error(`${format}：${res.error}`)
  // zint 的 SVG 只有固定的 width／height，改成 viewBox 才會跟著外框縮放；一維條碼可以只拉高不拉寬
  const fit = format === 'QRCode' ? 'xMidYMid meet' : 'none'
  return res.svg
    .replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg width="(\d+)" height="(\d+)"/, `<svg viewBox="0 0 $1 $2" preserveAspectRatio="${fit}" shape-rendering="crispEdges"`)
}

// 卡片右上（或左上）的小標籤。舊的兩種圖沿用原本的字與位置：掃描器「截圖」在左、條碼「EAN-13」在右
const DEFAULT_TAGS = { scan: { text: '截圖', color: 'sky' }, barcode: { text: 'EAN-13', color: 'sun', side: 'right' } }
function tagHtml(card) {
  const tag = card.tag ?? DEFAULT_TAGS[card.art]
  if (!tag) return ''
  return `<span class="tag tag-${tag.side ?? 'left'} c-${tag.color ?? 'sky'}">${esc(tag.text)}</span>`
}

/** 圖裡 QR Code 的內容：教學卡寫在 cards.mjs 的 qr（站內路徑），掃描器那張沿用 SCAN_QR_TEXT */
const qrText = (card) => (card.qr ? `${SITE_URL}${card.qr}` : SCAN_QR_TEXT)

// 〈Excel 怎麼做 QR Code 與條碼〉那張的試算表：跟文章同一份合成財產清冊的前三列，碼的內容就是財產編號
const SHEET_ROWS = ['A-0001', 'A-0002', 'A-0003']

/** 產圖後必須讀得出來的碼（內容）。教學示意圖（figure、ec）裡的碼由 gen-guide-figures.mjs 編，卡片的 qr 只用來驗它 */
function expectedCodes(card) {
  if (card.art === 'barcode') return [BARCODE_EAN13]
  if (card.art === 'sheet') return SHEET_ROWS
  if (card.art === 'scan' || card.art === 'qr' || card.qr) return [qrText(card)]
  return []
}

const publicSvg = (rel) => dataUri(readFileSync(join(ROOT, 'public', rel)), 'image/svg+xml')

async function artHtml(card) {
  const { art } = card
  if (art === 'logo') {
    return `<div class="art-logo"><img src="${dataUri(LOGO)}" alt=""></div>`
  }
  if (art === 'scan') {
    // 橫過中間的掃描線會蓋掉幾列方塊：網址長、方塊多的教學卡用容錯等級 H（cards.mjs 的 ec），首頁網址那張沿用預設
    const qr = await barcodeSvg(qrText(card), 'QRCode', card.ec ? `ecLevel=${card.ec}` : '')
    return `<div class="art-card">${tagHtml(card)}<div class="dash"><div class="qr">${qr}</div><div class="beam"></div></div></div>`
  }
  if (art === 'barcode') {
    const bars = await barcodeSvg(BARCODE_EAN13, 'EAN13')
    return `<div class="art-card">${tagHtml(card)}<div class="ean"><div class="bars">${bars}</div><div class="digits">${BARCODE_EAN13}</div></div></div>`
  }
  if (art === 'qr') {
    // 加 LOGO 的那張照文章的建議用最高的容錯等級 H，LOGO 蓋住的面積遠小於 H 能還原的範圍
    const qr = await barcodeSvg(qrText(card), 'QRCode', `ecLevel=${card.ec ?? (card.logo ? 'H' : 'M')}`)
    const logo = card.logo ? `<div class="qr-logo"><img src="${dataUri(await mark(LOGO, 160))}" alt=""></div>` : ''
    return `<div class="art-card">${tagHtml(card)}<div class="qr-big">${qr}${logo}</div></div>`
  }
  if (art === 'figure') {
    // 文章裡同一張示意圖（public/guides/ 的 SVG，gen-guide-figures.mjs 產生）
    return `<div class="art-card">${tagHtml(card)}<div class="fig"><img src="${publicSvg(card.figure)}" alt=""></div></div>`
  }
  if (art === 'ec') {
    // 容錯等級那篇的四張對照圖（同一個網址的 L/M/Q/H），跟文章裡的一樣
    const cells = [['L', 'sun'], ['M', 'mint'], ['Q', 'sky'], ['H', 'pink']]
      .map(([lv, color]) => `<div class="ec-cell"><img src="${publicSvg(`guides/ec-${lv.toLowerCase()}.svg`)}" alt=""><span class="ec-badge c-${color}">${lv}</span></div>`)
      .join('')
    return `<div class="art-card">${tagHtml(card)}<div class="ec-grid">${cells}</div></div>`
  }
  if (art === 'sheet') {
    const rows = await Promise.all(SHEET_ROWS.map(async (id, i) =>
      `<div class="rn">${i + 2}</div><div class="id">${esc(id)}</div>` +
      `<div class="qr-s">${await barcodeSvg(id, 'QRCode', 'ecLevel=M')}</div>` +
      `<div class="bc">${await barcodeSvg(id, 'Code128')}</div>`))
    return `<div class="art-card">${tagHtml(card)}<div class="sheet">` +
      '<div class="hd"></div><div class="hd">A</div><div class="hd">B</div><div class="hd">C</div>' +
      '<div class="rn">1</div><div class="th">財產編號</div><div class="th">QR Code</div><div class="th">條碼</div>' +
      `${rows.join('')}</div></div>`
  }
  throw new Error(`cards.mjs：不認得的 art「${art}」（${card.out}）`)
}

async function cardHtml(card) {
  const en = card.lang === 'en'
  return `<!doctype html><html lang="${en ? 'en' : 'zh-Hant'}"><head><meta charset="utf-8">
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
  .title { position: absolute; left: 66px; top: ${card.titleTop ?? 160}px; font-size: ${card.titleSize ?? 104}px; line-height: 1.12; font-weight: 900;
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
  .tag { position: absolute; top: -26px; height: 52px; display: flex; align-items: center; padding: 0 18px;
    border: 4px solid #16130f; border-radius: 12px; box-shadow: 4px 4px 0 #16130f; font-size: 26px; }
  .tag-left { left: 24px; transform: rotate(-6deg); }
  .tag-right { right: 22px; transform: rotate(8deg); }
  .c-sky { background: #38BDF8; } .c-sun { background: #FFD12E; } .c-mint { background: #36D399; } .c-pink { background: #FF5DA2; }
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
  .qr-big { position: relative; width: 318px; height: 318px; background: #fff; padding: 12px; }
  .qr-big svg { width: 100%; height: 100%; display: block; }
  .qr-logo { position: absolute; left: 50%; top: 50%; width: 84px; height: 84px; margin: -42px 0 0 -42px; background: #FFF7EA;
    border: 4px solid #16130f; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
  .qr-logo img { width: 66px; height: 66px; }
  .fig { width: 330px; height: 330px; }
  .fig img { width: 100%; height: 100%; display: block; }
  .ec-grid { display: grid; grid-template-columns: 170px 170px; gap: 18px; }
  .ec-cell { position: relative; width: 170px; height: 170px; border: 3px solid #16130f; border-radius: 10px; }
  .ec-cell img { width: 100%; height: 100%; display: block; border-radius: 7px; }
  /* 等級的字放右下角：QR Code 的三個定位方塊在左上、右上、左下，右下角蓋到一點點只算資料受損，容錯救得回來 */
  .ec-badge { position: absolute; right: -12px; bottom: -12px; width: 40px; height: 40px; border-radius: 50%; border: 3px solid #16130f;
    display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 3px 3px 0 #16130f; }
  .sheet { display: grid; grid-template-columns: 34px 106px 100px 124px; grid-template-rows: 34px 46px repeat(3, 92px);
    border: 2px solid #16130f; background: #fff; }
  .sheet > div { border-right: 1px solid #C9C4BA; border-bottom: 1px solid #C9C4BA; display: flex; align-items: center;
    justify-content: center; overflow: hidden; }
  .sheet .hd, .sheet .rn { background: #EFEBE3; color: #6B655C; font-size: 18px; }
  .sheet .th { font-size: 19px; }
  .sheet .id { font-family: ui-monospace, Menlo, monospace; font-size: 19px; font-weight: 700; }
  .sheet .qr-s svg { width: 72px; height: 72px; display: block; }
  .sheet .bc svg { width: 104px; height: 58px; display: block; }
</style></head><body>
  <div class="dot" style="left:640px;top:36px;width:62px;height:62px;background:#FFD12E"></div>
  <div class="dot" style="left:-70px;top:520px;width:170px;height:170px;background:#FF5DA2"></div>
  <div class="dot" style="left:1102px;top:548px;width:180px;height:180px;background:#36D399"></div>
  <div class="dot" style="left:602px;top:530px;width:34px;height:34px;background:#38BDF8"></div>
  <div class="spark" style="left:640px;top:452px"></div>
  ${await artHtml(card)}
  <div class="chip"><img src="${dataUri(await mark(LOGO, 100))}" alt="">${esc(en ? SITE_NAME_EN_FULL : SITE_NAME_FULL)}</div>
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

/**
 * 大標、橫幅、小標籤的右緣上限（px）。白底卡片（掃描器、條碼、教學）轉 4 度後最左約在 x = 707，再留描邊與陰影的空間；
 * 站徽那種（art: 'logo'）是透明底的圖，四周本來就有留白，字可以靠近一點（首頁那張的「免費 QR Code」到 x = 724）。
 */
const TEXT_RIGHT_LIMIT = { card: 700, logo: 730 }

/**
 * 圖裡的碼是真的：用站上同一版解碼器（zxing-wasm/reader，讀 node_modules 那一份 WASM，不連網）讀產好的 PNG，
 * expectedCodes 列的內容都要讀得出來。讀不到或內容不對就停，不寫檔。
 */
let readerReady = null
async function verifyCodes(card, png) {
  const expected = expectedCodes(card)
  if (!expected.length) return
  const { readBarcodes, prepareZXingModule } = await import('zxing-wasm/reader')
  readerReady ??= prepareZXingModule({
    overrides: { wasmBinary: readFileSync(join(ROOT, 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')).buffer },
    fireImmediately: true,
  })
  await readerReady
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const image = { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height, colorSpace: 'srgb' }
  const found = (await readBarcodes(image, { tryHarder: true, maxNumberOfSymbols: 8 })).filter((r) => r.isValid).map((r) => r.text)
  const missing = expected.filter((t) => !found.includes(t))
  if (missing.length) throw new Error(`${card.out}：圖裡的碼讀不到 ${missing.join('、')}（讀到：${found.join('、') || '沒有'}）`)
  console.log(`[brand] ${card.out} 的碼讀得出來：${expected.join('、')}`)
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
    // 字型依 unicode-range 分片載入，只檢查這張圖上真的有的漢字（含右邊圖裡的標籤與表頭；英數字先用 Fredoka，Noto 那幾片不會載）
    const text = (await page.evaluate(() => document.body.innerText)).replace(/[^\p{Script=Han}]/gu, '')
    // 英文卡沒有漢字，不必等 Noto Sans TC；英數字一律用內嵌的 Fredoka
    const ok = !text || await page.evaluate((t) => document.fonts.check('900 104px "Noto Sans TC"', t), text)
    if (!ok) throw new Error('Noto Sans TC 沒載到（要連網），不要用後備字型產圖')
    // 左半邊的字（大標、橫幅、小標籤）不能伸進右邊的圖
    const right = await page.evaluate(() =>
      Math.max(...[...document.querySelectorAll('.title span, .banner, .chips span')].map((el) => el.getBoundingClientRect().right)))
    const limit = TEXT_RIGHT_LIMIT[card.art === 'logo' ? 'logo' : 'card']
    if (right > limit) throw new Error(`${card.out}：字寬到 x = ${Math.round(right)}，超過 ${limit}（縮短字或調小 titleSize）`)
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
    const out = await sharp(png).resize(1200, 630, { kernel: 'lanczos3' }).png({ palette: true, colours: 256, effort: 10 }).toBuffer()
    await verifyCodes(card, out)
    write(card.out, out)
  }
  await browser.close()
}
console.log(`[brand] 站名：${SITE_NAME}（${SITE_NAME_FULL}）`)
