/**
 * 下載檔的四邊靜區（四周留白）與自解碼 oracle。
 *
 * QR Code 規格要求四邊都至少留 4 個模組寬的空白，站內教學也是這樣寫的。這裡拿 production 的設定
 * （`mapToQrOptions` ＋ 真的 qr-code-styling）做出 PNG／SVG／JPG，從像素量回模組大小與四邊留白，
 * 再用本站自架、精確鎖版的 zxing-wasm 解回來，內容要一個位元組都不差。
 *
 * - v1.7.2 以前 margin 固定 8 px：https://example.com、M、1000 px 的 SVG 四周只有 12 px，約 0.31 個模組。
 * - 之後升級 qr-code-styling、換編碼器、調整尺寸或留白、加新的下載格式時，這份要一起跑。
 * - 產物怎麼做、怎麼量，見 test/helpers/qr-artifact.ts。測試不連網：fetch 換成會丟錯的版本。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { mapToQrOptions, qrGeometry } from './useQrCode'
import { defaultStyle, type ErrorCorrectionLevel, type QrStyleOptions } from '@/types'
import { buildWifi } from '@/pure/buildWifi'
import { loadZXingReader, READER_OPTIONS } from '@/utils/zxing-reader'
import { makeArtifact, measureQuietZone, onWhite, type ArtifactFormat, type Pixels } from '../../test/helpers/qr-artifact'

// happy-dom 環境下 import.meta.url 不是 file: 網址，改用專案根目錄推路徑。
const LOCAL_WASM = join(process.cwd(), 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')
const offlineOverrides = { wasmBinary: readFileSync(LOCAL_WASM).buffer }

const realFetch = globalThis.fetch
beforeAll(() => {
  globalThis.fetch = (() => { throw new Error('測試不得發出任何網路請求') }) as typeof fetch
})
afterAll(() => { globalThis.fetch = realFetch })

/** 測試自己畫的 LOGO（實心圓），不從網路抓圖 */
let logoDataUrl = ''
beforeAll(async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" rx="24" fill="#e11d48"/><circle cx="80" cy="60" r="34" fill="#fde047"/></svg>'
  logoDataUrl = 'data:image/png;base64,' + (await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')
})

/** 解回來的內容要跟原本的位元組一模一樣（中文、emoji 是 UTF-8） */
async function expectDecodesTo(pixels: Pixels, payload: string) {
  const zxing = await loadZXingReader(offlineOverrides)
  const results = await zxing.readBarcodes(onWhite(pixels) as unknown as ImageData, READER_OPTIONS)
  expect(results.map(r => r.format)).toEqual(['QRCode'])
  expect(Buffer.from(results[0].bytes).equals(Buffer.from(new TextEncoder().encode(payload)))).toBe(true)
  expect(results[0].text).toBe(payload)
}

/** 做出產物、量幾何、解碼，三件事一起驗 */
async function check(payload: string, style: QrStyleOptions, format: ArtifactFormat) {
  const expected = qrGeometry(payload, style)
  expect(expected, '這組設定應該放得下').not.toBeNull()
  const art = await makeArtifact(mapToQrOptions(payload, style), format)

  // 外部寬高就是使用者選的大小，不靠放大畫布補留白
  expect([art.width, art.height]).toEqual([style.width, style.width])
  expect([art.pixels.width, art.pixels.height]).toEqual([style.width, style.width])

  // 擋住留白變窄的是這段像素量測，不是後面的解碼：zxing 在完全沒有留白時照樣解得出來，這幾行不能當成多餘拿掉。
  const g = measureQuietZone(art.pixels)
  expect(g.moduleCount).toBe(expected!.moduleCount)
  expect(g.moduleSize).toBeCloseTo(expected!.moduleSize, 0)
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    expect(g.quiet[side], `${format} ${style.width}px ${side}`).toBeGreaterThanOrEqual(4)
  }

  await expectDecodesTo(art.pixels, payload)
  return { art, g }
}

describe('下載檔保留四模組靜區', () => {
  it('預設設定、https://example.com、M、1000 px 的 SVG：四邊都至少 4 個模組', async () => {
    const style = { ...defaultStyle, width: 1000, errorCorrectionLevel: 'M' as const }
    const art = await makeArtifact(mapToQrOptions('https://example.com', style), 'svg')
    expect(art.width).toBe(1000)
    expect(art.height).toBe(1000)
    const g = measureQuietZone(art.pixels)
    expect(g.moduleCount).toBe(25)
    expect(g.quiet.top).toBeGreaterThanOrEqual(4)
    expect(g.quiet.right).toBeGreaterThanOrEqual(4)
    expect(g.quiet.bottom).toBeGreaterThanOrEqual(4)
    expect(g.quiet.left).toBeGreaterThanOrEqual(4)
  })
})

const SHORT = 'https://example.com'
const LONG = 'https://www.pocketool.app/qrcode-studio/guide/qr-code-svg/?utm_source=poster&utm_medium=print&utm_campaign=autumn-fair-2026&ref='
  + 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(4)
const LEVELS: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
const SIZES = [200, 1000, 2000]
const FORMATS: ArtifactFormat[] = ['png', 'svg', 'jpg']

describe('產物矩陣：短／長內容 × L／M／Q／H × 200／1000／2000 px × 有無 LOGO × PNG／SVG／JPG', () => {
  for (const [label, payload] of [['短', SHORT], ['長', LONG]] as const) {
    for (const ec of LEVELS) {
      for (const width of SIZES) {
        for (const logo of [false, true]) {
          it(`${label}內容、${ec}、${width} px、${logo ? '有' : '無'} LOGO`, async () => {
            const style: QrStyleOptions = { ...defaultStyle, width, errorCorrectionLevel: ec, logoDataUrl: logo ? logoDataUrl : null }
            for (const format of FORMATS) await check(payload, style, format)
          }, 30_000)
        }
      }
    }
  }
})

describe('各種內容都解得回原本的位元組', () => {
  const cases: [string, string][] = [
    ['中文', '口袋工具 QR Code 製造機：中文內容'],
    ['換行', 'BEGIN:VCARD\nVERSION:3.0\nN:王;小明;;;\nFN:小明 王\nTEL:0912345678\nEND:VCARD'],
    ['emoji', '報名成功 😀🎉'],
    ['網址參數', 'https://example.com/search?q=%E5%8F%A3%E8%A2%8B&lang=zh-TW&page=2#top'],
    ['WiFi 跳脫', buildWifi({ ssid: 'Cafe;Bar,"Guest"', password: 'p:a\\ss;word', encryption: 'WPA', hidden: false })],
    ['純數字', '0912345678'],
    ['大寫英數', 'HTTPS://EXAMPLE.COM/A-1'],
  ]
  for (const [label, payload] of cases) {
    it(label, async () => {
      for (const format of FORMATS) await check(payload, { ...defaultStyle, width: 1000 }, format)
    })
  }

  it('WiFi 跳脫的內容真的含有跳脫字元', () => {
    const wifi = cases.find(([l]) => l === 'WiFi 跳脫')![1]
    expect(wifi).toContain('\\;')
    expect(wifi).toContain('\\:')
    expect(wifi).toContain('\\\\')
  })
})

describe('透明背景', () => {
  for (const logo of [false, true]) {
    it(`PNG／SVG 的四周留白是透明的，疊在白底上照樣有 4 模組；JPG 改成白底（${logo ? '有' : '無'} LOGO）`, async () => {
      const style: QrStyleOptions = { ...defaultStyle, width: 1000, bgColor: 'transparent', logoDataUrl: logo ? logoDataUrl : null }
      for (const format of FORMATS) {
        const { art, g } = await check(SHORT, style, format)
        const corner = art.pixels.data.slice(0, 4) // 左上角落在靜區裡
        if (format === 'jpg') {
          expect(corner[3]).toBe(255)
          expect(Math.min(corner[0], corner[1], corner[2])).toBeGreaterThan(240)
        } else {
          expect(corner[3]).toBe(0)
        }
        expect(g.minQuiet).toBeGreaterThanOrEqual(4)
      }
    })
  }

  it('漸層方塊也一樣', async () => {
    const style: QrStyleOptions = { ...defaultStyle, width: 1000, useGradient: true }
    for (const format of FORMATS) await check(SHORT, style, format)
  })
})

describe('高密度內容在最小的圖片大小也守得住', () => {
  it('200 px、L、版本 40 的內容：每個模組 1 px，四邊仍至少 4 個模組', async () => {
    const payload = 'a'.repeat(2900)
    const style: QrStyleOptions = { ...defaultStyle, width: 200, errorCorrectionLevel: 'L' }
    expect(qrGeometry(payload, style)).toMatchObject({ moduleCount: 177, moduleSize: 1 })
    for (const format of ['png', 'svg'] as const) await check(payload, style, format)
  }, 30_000)
})
