/**
 * 批次產物的回讀：每一種碼制抽樣，照 production 的路徑做出 ZIP 裡的 SVG 與 PNG，
 * 再用本站自架、精確鎖版的 zxing-wasm 讀回來，內容要一字不差。
 *
 * - SVG：artifactSvg 的檔案內容原樣進 ZIP，從 ZIP 讀出來交給 sharp（librsvg）光柵化。
 *   一維條碼的 SVG 寬高是毫米，光柵化時給 400 dpi，最細的線才有好幾個像素。
 * - PNG：瀏覽器裡是把 artifactPlan 的矩形填進 canvas。這裡用同一份計畫、同一個 paintPlan，
 *   填進一塊 RGBA 像素陣列（假的 canvas 只實作 fillRect；人眼可讀的號碼用字型畫，解碼用不到）。
 * - 測試不連網：fetch 換成會丟錯的版本，WASM 直接餵 node_modules 那一份。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { loadZXingReader, READER_OPTIONS } from '@/utils/zxing-reader'
import { toScanFormat } from '../scanFormats'
import { paintPlan, type PlanCanvas, type RasterPlan } from '../raster'
import { artifactPlan, artifactSvg, type ArtifactSettings } from './artifact'
import { checkRows, rowsFromLines, rowsFromSequence, assignFileNames, type BatchSymbology, type ReadyRow } from './rows'
import { buildSequence } from './sequence'
import { zipParts } from './zip'
import { concat, readZip } from '../../../test/helpers/zip'

const LOCAL_WASM = join(process.cwd(), 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')
const offlineOverrides = { wasmBinary: readFileSync(LOCAL_WASM).buffer }

const realFetch = globalThis.fetch
beforeAll(() => {
  globalThis.fetch = (() => { throw new Error('測試不得發出任何網路請求') }) as typeof fetch
})
afterAll(() => { globalThis.fetch = realFetch })

interface Pixels { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number; colorSpace: 'srgb' }

/** 只實作 paintPlan 用到的 fillRect（純黑或純白），填進 RGBA 像素 */
function rasterize(plan: RasterPlan): Pixels {
  const data = new Uint8ClampedArray(new ArrayBuffer(plan.width * plan.height * 4))
  const ctx = {
    fillStyle: '#000000' as unknown, font: '', textAlign: 'center' as CanvasTextAlign, imageSmoothingEnabled: true,
    fillRect(x: number, y: number, w: number, h: number) {
      const v = this.fillStyle === '#ffffff' ? 255 : 0
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          const i = (yy * plan.width + xx) * 4
          data[i] = data[i + 1] = data[i + 2] = v
          data[i + 3] = 255
        }
      }
    },
    fillText() { /* 號碼用字型畫，解碼用不到 */ },
  } satisfies PlanCanvas
  paintPlan(ctx, plan)
  return { data, width: plan.width, height: plan.height, colorSpace: 'srgb' }
}

async function svgPixels(svg: Uint8Array, density: number): Promise<Pixels> {
  const { data, info } = await sharp(Buffer.from(svg), { density }).flatten({ background: '#ffffff' }).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true })
  const out = new Uint8ClampedArray(new ArrayBuffer(data.length))
  out.set(data)
  return { data: out, width: info.width, height: info.height, colorSpace: 'srgb' }
}

async function readOne(pixels: Pixels) {
  const zxing = await loadZXingReader(offlineOverrides)
  const results = await zxing.readBarcodes(pixels as unknown as ImageData, READER_OPTIONS)
  expect(results, '應該剛好讀到一個碼').toHaveLength(1)
  return { format: toScanFormat(results[0]!.format, results[0]!.text), text: results[0]!.text, bytes: results[0]!.bytes }
}

const expectedFormat = (s: BatchSymbology) => (s === 'qr' ? 'qrcode' : s)

/** 照 production 的流程：檢查 → 檔名 → SVG 檔進 ZIP → 從 ZIP 讀回來 */
function zipOfSvgs(rows: ReadyRow[], settings: ArtifactSettings) {
  const names = assignFileNames(rows, rows.length, 'value', settings.symbology, 'svg')
  const enc = new TextEncoder()
  const zip = concat(zipParts(rows.map((r, i) => ({ name: names[i]!, data: enc.encode(artifactSvg(r.normalized, settings)!) }))))
  return readZip(zip)
}

const CASES: { symbology: BatchSymbology; lines: string[]; template?: string }[] = [
  { symbology: 'qr', lines: ['TP-2026-0001', '財產 筆電/03', 'A&B=C'], template: 'https://example.com/asset/{編號}' },
  { symbology: 'qr', lines: ['https://docs.google.com/forms/d/e/X/viewform?usp=pp_url&entry.1=0007', '中文內容與 emoji 😀', '0912345678'] },
  { symbology: 'code128', lines: ['TP-2026-0001', 'abc 123', '1234567890'] },
  { symbology: 'ean13', lines: ['200000000001', '4710088331236'] },
  { symbology: 'ean8', lines: ['5512345', '96385074'] },
  { symbology: 'code39', lines: ['ab-12', 'TP 0001'] },
  { symbology: 'itf14', lines: ['1540014128876', '15400141288763'] },
]

describe('批次產物回讀：每種碼制的 SVG 與 PNG 都讀得回原本的內容', () => {
  for (const c of CASES) {
    const settings: ArtifactSettings = { symbology: c.symbology, ec: 'M', qrSize: 600, barcodeScale: 4 }
    const rows = checkRows(rowsFromLines(c.lines.join('\n')), { symbology: c.symbology, ec: 'M', template: c.template ?? '' })
    const ready = rows.filter((r): r is ReadyRow => r.ok)

    it(`${c.symbology}${c.template ? '（網址範本）' : ''}：每一列都可以產生`, () => {
      expect(ready).toHaveLength(c.lines.length)
    })

    it(`${c.symbology}：ZIP 裡的 SVG`, async () => {
      const files = zipOfSvgs(ready, settings)
      expect(files).toHaveLength(ready.length)
      for (const [i, f] of files.entries()) {
        const got = await readOne(await svgPixels(f.data, c.symbology === 'qr' ? 72 : 400))
        expect(got.format).toBe(expectedFormat(c.symbology))
        expect(got.text).toBe(ready[i]!.normalized)
      }
    }, 30_000)

    it(`${c.symbology}：PNG 的畫法`, async () => {
      for (const r of ready) {
        const plan = artifactPlan(r.normalized, settings)!
        const got = await readOne(rasterize(plan))
        expect(got.format).toBe(expectedFormat(c.symbology))
        expect(got.text).toBe(r.normalized)
        if (c.symbology === 'qr') expect(Buffer.from(got.bytes).equals(Buffer.from(new TextEncoder().encode(r.normalized)))).toBe(true)
      }
    }, 30_000)
  }

  it('網址範本代入後的網址解得回轉碼後的樣子', () => {
    const rows = checkRows(rowsFromLines('財產 筆電/03'), { symbology: 'qr', ec: 'M', template: 'https://example.com/asset/{編號}' })
    expect(rows[0]!.ok && rows[0]!.normalized).toBe('https://example.com/asset/%E8%B2%A1%E7%94%A2%20%E7%AD%86%E9%9B%BB%2F03')
  })

  it('店內碼連號：每一張都讀得出補好檢查碼的 13 位數', async () => {
    const seq = buildSequence({ prefix: '20', start: '41', until: 'count', count: '5', end: '', step: '1', pad: '10', suffix: '' }, 2000)
    if (!seq.ok) throw new Error(seq.error)
    const ready = checkRows(rowsFromSequence(seq.values), { symbology: 'ean13', ec: 'M', template: '' }).filter((r): r is ReadyRow => r.ok)
    expect(ready).toHaveLength(5)
    for (const r of ready) {
      const got = await readOne(rasterize(artifactPlan(r.normalized, { symbology: 'ean13', ec: 'M', qrSize: 600, barcodeScale: 2 })!))
      expect(got.text).toBe(r.normalized)
      expect(got.text).toMatch(/^20\d{11}$/)
    }
  }, 30_000)

  it('QR Code 的 PNG 在最小與最大的圖片大小都讀得回來', async () => {
    const content = 'https://example.com/asset/TP-2026-00001'
    for (const qrSize of [300, 1500]) {
      const got = await readOne(rasterize(artifactPlan(content, { symbology: 'qr', ec: 'H', qrSize, barcodeScale: 4 })!))
      expect(got.text).toBe(content)
    }
  }, 30_000)
})

describe('Code 39 的 $ / + %：合法但讀回來會變', () => {
  // 這幾筆是合法的 Code 39，照樣產生；但掃描器會把 $ / + % 跟下一個字合起來讀（Full ASCII），讀回來的值變了。
  // 批次頁的「檢查結果」因此一律提醒（data-test="batch-code39-shift"），這裡鎖住提醒存在的理由。
  it('Code 39 含 $ / + % 時，讀回來的值跟原本不一樣', async () => {
    const lines = ['A/B', 'TP+G01', 'AB$E1', 'X%U']
    const ready = checkRows(rowsFromLines(lines.join('\n')), { symbology: 'code39', ec: 'M', template: '' })
      .filter((r): r is ReadyRow => r.ok)
    expect(ready.map(r => r.normalized)).toEqual(lines)
    const texts: string[] = []
    for (const r of ready) {
      const got = await readOne(rasterize(artifactPlan(r.normalized, { symbology: 'code39', ec: 'M', qrSize: 600, barcodeScale: 4 })!))
      expect(got.format).toBe('code39')
      texts.push(got.text)
    }
    // 讀取器把控制字元寫成 <ENQ>、<NUL> 這樣的文字
    expect(texts).toEqual(['A"', 'TPg01', 'AB<ENQ>1', 'X<NUL>'])
  }, 30_000)
})
