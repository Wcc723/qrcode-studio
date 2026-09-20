#!/usr/bin/env node
/**
 * 產生 /scan/ 解碼器的黃金測試圖。**離線執行，產物進版控**，平常不會跑到。
 *
 *   node scripts/fixtures/gen-scan-fixtures.mjs
 *
 * 為什麼要有這支：解碼器的回歸測試必須拿真圖去讀，mock 出來的「解碼結果」
 * 證明不了任何事。圖又不能從網路抓（來源不明、會變、離線就爛），所以用與
 * production 完全同一版的 zxing-wasm 3.1.4 writer 離線產生，再固定在 repo 裡。
 *
 * 兩個刻意的細節：
 * - writer 的 WASM 用 `wasmBinary` 從 node_modules 直接餵進去。zxing-wasm 預設的
 *   locateFile 會去 fastly.jsdelivr 抓，這支腳本與測試都不該碰網路。
 * - JPEG／WebP／多碼合成圖用 sharp 產生。sharp 不是本專案的直接相依，而是開發
 *   環境（wrangler → miniflare）帶進來的；只有重新產生圖時才需要它，測試不需要。
 *   沒有 sharp 時腳本會明講，不會靜默跳過。
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const outDir = join(repoRoot, 'test', 'fixtures', 'scan')

const { writeBarcode, prepareZXingModule } = await import('zxing-wasm/writer')
prepareZXingModule({
  overrides: { wasmBinary: readFileSync(join(repoRoot, 'node_modules/zxing-wasm/dist/writer/zxing_writer.wasm')).buffer },
})

let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('[fixtures] 需要 sharp 才能產生 JPEG／WebP／多碼合成圖。請先 npm install。')
  process.exit(1)
}

/** 六種支援格式各一張。內容刻意用站內產生器示例值，方便人眼對照。 */
const CASES = [
  { name: 'qrcode-url', format: 'QRCode', text: 'https://www.pocketool.app/qrcode-studio/' },
  { name: 'qrcode-wifi', format: 'QRCode', text: 'WIFI:T:WPA;S:Cafe\\;Bar;P:p\\:a\\\\ss;H:false;;' },
  { name: 'code128', format: 'Code128', text: 'ABC-12345' },
  { name: 'ean13', format: 'EAN13', text: '4710088331236' },
  { name: 'ean8', format: 'EAN8', text: '55123457' },
  { name: 'code39', format: 'Code39', text: 'ABC-1234' },
  { name: 'itf14', format: 'ITF14', text: '15400141288763' },
]

mkdirSync(outDir, { recursive: true })

const manifest = []

async function toPng(buffer) {
  // 統一成 8-bit RGB、非隔行、不用調色盤：測試端的 PNG 解碼輔助函式因此只要處理
  // 固定的一種編碼，不必為了讀自家 fixture 寫一個完整的 PNG 解碼器。
  return sharp(buffer).removeAlpha().toColourspace('srgb').png({ palette: false, compressionLevel: 9 }).toBuffer()
}

for (const c of CASES) {
  const res = await writeBarcode(c.text, { format: c.format, scale: 4, withQuietZones: true })
  if (res.error) throw new Error(`${c.name}: ${res.error}`)
  const png = await toPng(Buffer.from(await res.image.arrayBuffer()))
  writeFileSync(join(outDir, `${c.name}.png`), png)
  manifest.push({ file: `${c.name}.png`, format: c.format, text: c.text })
}

// 同一張 QR 的三種容器：PNG（上面已寫）、JPEG（有失真壓縮雜訊）、WebP（無損）。
const qrPng = readFileSync(join(outDir, 'qrcode-url.png'))
writeFileSync(join(outDir, 'qrcode-url.jpg'),
  await sharp(qrPng).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toBuffer())
writeFileSync(join(outDir, 'qrcode-url.webp'),
  await sharp(qrPng).webp({ lossless: true }).toBuffer())

// 六種格式的 JPEG 版：證明有失真壓縮之後六種都還讀得回來。
for (const c of CASES) {
  const png = readFileSync(join(outDir, `${c.name}.png`))
  writeFileSync(join(outDir, `${c.name}.jpg`),
    await sharp(png).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toBuffer())
}

// 多碼圖：兩張 QR 並排。這是截圖場景最常見的形狀（畫面上同時有兩個碼）。
{
  const a = await sharp(qrPng).resize(240, 240, { fit: 'contain', background: '#ffffff' }).toBuffer()
  const b = await sharp(await (async () => {
    const r = await writeBarcode('https://www.pocketool.app/qrcode-studio/barcode/', { format: 'QRCode', scale: 4 })
    return toPng(Buffer.from(await r.image.arrayBuffer()))
  })()).resize(240, 240, { fit: 'contain', background: '#ffffff' }).toBuffer()
  const composed = await sharp({
    create: { width: 540, height: 280, channels: 3, background: '#ffffff' },
  })
    .composite([{ input: a, left: 10, top: 20 }, { input: b, left: 290, top: 20 }])
    .png({ palette: false, compressionLevel: 9 })
    .toBuffer()
  writeFileSync(join(outDir, 'multi-qrcode.png'), composed)
}

// 一張沒有任何條碼的圖，用來釘住「讀不到」的狀態。
writeFileSync(join(outDir, 'no-barcode.png'), await sharp({
  create: { width: 300, height: 200, channels: 3, background: '#e8e8e8' },
}).png({ palette: false }).toBuffer())

console.log(`[fixtures] 寫入 ${outDir}`)
for (const m of manifest) console.log(`  ${m.file}  ${m.format}  ${JSON.stringify(m.text)}`)
console.log('  qrcode-url.jpg / qrcode-url.webp / *.jpg / multi-qrcode.png / no-barcode.png')
