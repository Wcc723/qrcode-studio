/**
 * 黃金往返測試：用 production 的 qr-code-styling 編碼、production 的 zxing-wasm 解碼，
 * 確認中文、emoji 掃出來就是原本的文字。
 *
 * 這條測試抓的是真實出過的 bug：qr-code-styling 內建的 qrcode-generator 用
 * `charCodeAt & 0xff` 轉位元組，沒經過 toQrByteString 的話「你好世界」會解成亂碼。
 * 單元測試只驗得到字串轉換本身，這裡驗的是「掃得出來的東西對不對」。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import QRCodeStyling from 'qr-code-styling'
import { mapToQrOptions } from './useQrCode'
import { defaultStyle } from '@/types'
import { decodeImageData } from '@/utils/zxing-reader'

// happy-dom 環境下 import.meta.url 不是 file: 網址，改用專案根目錄推路徑。
const LOCAL_WASM = join(process.cwd(), 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')
const offlineOverrides = { wasmBinary: readFileSync(LOCAL_WASM).buffer }

const realFetch = globalThis.fetch
beforeAll(() => {
  globalThis.fetch = (() => { throw new Error('測試不得發出任何網路請求') }) as typeof fetch
})
afterAll(() => { globalThis.fetch = realFetch })

/** 用 qr-code-styling 實際產生的模組矩陣畫成黑白像素（每模組 4px、四周 4 模組靜區）。 */
function renderMatrix(text: string) {
  const qr = new QRCodeStyling({ ...mapToQrOptions(text, defaultStyle), type: 'svg' })
  const matrix = (qr as unknown as { _qr: { getModuleCount(): number; isDark(r: number, c: number): boolean } })._qr
  const count = matrix.getModuleCount()
  const scale = 4, quiet = 4
  const size = (count + quiet * 2) * scale
  const data = new Uint8ClampedArray(new ArrayBuffer(size * size * 4)).fill(255)
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!matrix.isDark(r, c)) continue
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const i = (((r + quiet) * scale + y) * size + (c + quiet) * scale + x) * 4
          data[i] = data[i + 1] = data[i + 2] = 0
        }
      }
    }
  }
  return { data, width: size, height: size, colorSpace: 'srgb' as const }
}

describe('非 ASCII 內容編碼後掃得回原文', () => {
  for (const text of [
    '你好世界 QR',
    'BEGIN:VCARD\nVERSION:3.0\nN:王;小明;;;\nFN:小明 王\nORG:口袋咖啡\nEND:VCARD',
    'WIFI:T:WPA;S:口袋咖啡_訪客;P:coffee2026;H:false;;',
    'SMSTO:0912345678:報名 😀',
    'https://www.pocketool.app/qrcode-studio/',
  ]) {
    it(JSON.stringify(text).slice(0, 40), async () => {
      const results = await decodeImageData(renderMatrix(text) as unknown as ImageData, offlineOverrides)
      expect(results).toHaveLength(1)
      expect(results[0].text).toBe(text)
    })
  }
})
