#!/usr/bin/env node
/**
 * 教學〈Excel 怎麼做 QR Code 與條碼〉的兩張範例圖：用 build 好的批次頁實際做一次，截圖後轉成 WebP。
 * 產物在 public/guides/（進版控），這支不進 build；批次頁改版、畫面跟圖對不上時才重跑。步驟與參數的說明在 docs/batch.md。
 *
 *   npm run build
 *   npx vite preview --port 4173 --strictPort                        # 另一個終端機，網址是 http://localhost:4173/qrcode-studio/
 *   PLAYWRIGHT_MODULE=<playwright 套件目錄> node scripts/figures/batch-screenshots.mjs
 *   node scripts/figures/batch-screenshots.mjs --base http://127.0.0.1:5173/qrcode-studio --out /tmp/figs   # 換網址、先產到別處比對
 *
 * 本 repo 不裝 Playwright：找它的方式跟 scripts/brand/render.mjs 一樣，先 import('playwright')，找不到就用環境變數
 * PLAYWRIGHT_MODULE（任何一份 playwright 或 @playwright/test 套件目錄的絕對路徑，例如 npx 快取裡那份），
 * 必要時再用 PLAYWRIGHT_CHROMIUM 指定瀏覽器執行檔。
 *
 * 清單是合成的財產清冊（財產編號 A-0001 到 A-0024，品名與保管單位都是假資料），不要換成真的清單。
 * GA 與廣告的請求一律擋掉（本機的 preview 本來就不載入 GA，擋了也不影響畫面）。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(name)
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}
const BASE = arg('--base', 'http://localhost:4173/qrcode-studio').replace(/\/+$/, '')
const OUT = arg('--out', join(ROOT, 'public/guides'))
const BLOCK = /googletagmanager\.com|google-analytics\.com|googlesyndication\.com|doubleclick\.net|cloudflareinsights\.com/

// 合成的財產清冊：第一列是欄名，財產編號 A-0001 起
const ITEMS = [
  ['筆記型電腦', '總務組'], ['投影機', '會議室'], ['雷射印表機', '資訊組'], ['桌上型電腦', '會計組'],
  ['液晶螢幕', '會計組'], ['無線基地台', '資訊組'], ['碎紙機', '總務組'], ['事務機', '人事組'],
  ['筆記型電腦', '業務組'], ['平板電腦', '業務組'], ['網路交換器', '資訊組'], ['電子白板', '會議室'],
  ['桌上型電腦', '人事組'], ['條碼掃描器', '倉儲組'], ['標籤印表機', '倉儲組'], ['液晶螢幕', '業務組'],
  ['投影機', '教育訓練室'], ['麥克風組', '教育訓練室'], ['筆記型電腦', '總務組'], ['外接硬碟', '資訊組'],
  ['桌上型電腦', '倉儲組'], ['事務機', '業務組'], ['數位相機', '總務組'], ['延長線', '會議室'],
]
const TSV = ['財產編號\t品名\t保管單位', ...ITEMS.map(([name, unit], i) => `A-${String(i + 1).padStart(4, '0')}\t${name}\t${unit}`)].join('\n') + '\n'

// 截圖用 1100×1000 的視窗、2 倍解析度，再縮成文章用的寬度（文章裡以一半的寬高顯示，高解析度螢幕看得清楚）
const VIEWPORT = { width: 1100, height: 1000 }
const SHOTS = {
  qr: { file: 'excel-batch-qr.webp', width: 1440, quality: 72 },
  labels: { file: 'excel-batch-labels.webp', width: 960, quality: 80 },
}

async function loadChromium() {
  try {
    return (await import('playwright')).chromium
  } catch {
    const dir = process.env.PLAYWRIGHT_MODULE
    if (!dir) throw new Error('找不到 Playwright：設 PLAYWRIGHT_MODULE=<playwright 或 @playwright/test 套件目錄>')
    return createRequire(join(dir, 'package.json'))(dir).chromium
  }
}

async function toWebp(png, { file, width, quality }) {
  const buf = await sharp(png).resize({ width }).webp({ quality, effort: 6 }).toBuffer()
  const { height } = await sharp(buf).metadata()
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, file), buf)
  // 文章的 <img> 寫的 width／height 是這裡的一半，裁切高度變了要一起改
  console.log(`[figures] ${file}：${width}×${height}（文章寫 ${width / 2}×${Math.round(height / 2)}），${(buf.length / 1024).toFixed(1)} KB`)
}

const chromium = await loadChromium()
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined })
try {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  await ctx.route('**/*', (r) => (BLOCK.test(r.request().url()) ? r.fulfill({ status: 204, body: '' }) : r.continue()))
  const page = await ctx.newPage()
  page.setDefaultTimeout(30000)
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' && !BLOCK.test(m.location()?.url ?? '')) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(`${BASE}/batch/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.fill('[data-test="batch-paste"]', TSV)

  // 第一張：碼的種類選 QR Code、內容範本填網址，截工具卡從頂端到預覽的第一列
  await page.click('label:has([data-test="batch-sym-qr"])')
  await page.fill('[data-test="batch-template"]', 'https://example.com/asset/{編號}')
  await page.waitForSelector('[data-test="batch-preview"]')
  await page.waitForTimeout(600)
  await page.$eval('[data-test="batch-paste"]', (el) => { el.scrollTop = 0 })
  await page.$eval('[data-test="batch-template"]', (el) => el.blur())
  await page.waitForTimeout(200)
  const clip = await page.evaluate(() => {
    const tool = document.querySelector('[data-test="batch-tool"]').getBoundingClientRect()
    const firstName = document.querySelector('[data-test="batch-preview-name"]')
    const rowBottom = firstName.closest('div,li,figure').getBoundingClientRect().bottom
    return { x: tool.x + scrollX, y: tool.y + scrollY, width: tool.width, height: rowBottom - tool.y + 6 }
  })
  await toWebp(await page.screenshot({ fullPage: true, clip }), SHOTS.qr)
  console.log('[figures] 檢查結果：', (await page.textContent('[data-test="batch-summary"]'))?.replace(/\s+/g, ' ').trim())

  // 第二張：同一份清單改成 Code 128、範本清空，輸出方式選「印成 A4 標籤紙」（預設型號鶴屋 L3464），截第一頁標籤紙
  await page.click('label:has([data-test="batch-sym-code128"])')
  await page.fill('[data-test="batch-template"]', '')
  await page.waitForTimeout(400)
  await page.click('label:has([data-test="batch-output-label"])')
  await page.waitForSelector('[data-test="label-sheet"]')
  await page.waitForTimeout(800)
  await toWebp(await page.locator('[data-test="label-sheet"]').first().screenshot(), SHOTS.labels)
  console.log('[figures] 標籤紙：', (await page.textContent('[data-test="label-sheet-info"]'))?.replace(/\s+/g, ' ').trim())

  if (errors.length) throw new Error(`頁面有錯誤：${errors.join(' | ')}`)
} finally {
  await browser.close()
}
