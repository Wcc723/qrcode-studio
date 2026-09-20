// @vitest-environment node
/**
 * 黃金解碼測試：拿真的圖、真的 WASM 走一次 production 的解碼函式。
 * 圖由 scripts/fixtures/gen-scan-fixtures.mjs 以同版 zxing-wasm writer 離線產生。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ZXING_WASM_VERSION, ZXING_WASM_SHA256 } from 'zxing-wasm/reader'
import { createHash } from 'node:crypto'
import { decodeImageData, decodeImageSource, READER_OPTIONS, selfHostedOverrides, ZXING_WASM_URL } from './zxing-reader'
import { toScanOutcome } from '@/pure/scanResult'
import { readFixtureImage, readFixture } from '../../test/helpers/png'

// 用 fileURLToPath 而不是 URL.pathname：repo 路徑含非 ASCII 字元時 pathname 是百分號編碼的。
const LOCAL_WASM = fileURLToPath(new URL('../../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm', import.meta.url))

/**
 * Node 沒有瀏覽器的 fetch-同源語意，zxing-wasm 預設的 locateFile 會去
 * fastly.jsdelivr 抓 WASM。測試改用 `wasmBinary` 直接餵 node_modules 那一份：
 * 這樣測試完全不碰網路，而且讀的一定是與 package.json 鎖定同一版的二進位檔。
 */
const offlineOverrides = { wasmBinary: readFileSync(LOCAL_WASM).buffer }

async function decodeFixture(name: string) {
  return decodeImageData(readFixtureImage(name), offlineOverrides)
}

/**
 * 整個檔案期間把 fetch 換成會拋錯的版本。這不是潔癖：zxing-wasm 預設會去
 * fastly.jsdelivr 抓 WASM，而這台機器有網路，所以就算自架設定整個失效，
 * 測試還是會「通過」。用這個 guard 之後，只要有人不小心讓解碼去連網就會紅。
 */
const realFetch = globalThis.fetch
beforeAll(() => {
  globalThis.fetch = (() => { throw new Error('解碼過程不得發出任何網路請求') }) as typeof fetch
})
afterAll(() => { globalThis.fetch = realFetch })

describe('WASM 版本綁定', () => {
  it('node_modules 的 WASM 雜湊等於套件自己 export 的 ZXING_WASM_SHA256', () => {
    const actual = createHash('sha256').update(readFileSync(LOCAL_WASM)).digest('hex')
    expect(actual).toBe(ZXING_WASM_SHA256)
  })

  it('鎖定在 3.1.4：JS 與 WASM 必須同版', () => {
    expect(ZXING_WASM_VERSION).toBe('3.1.4')
  })

  it('自架設定只改 .wasm 的位置，其餘沿用原本前綴', () => {
    const { locateFile } = selfHostedOverrides('/qrcode-studio/assets/zxing_reader-abc123.wasm')
    expect(locateFile('zxing_reader.wasm', 'https://cdn.example/')).toBe('/qrcode-studio/assets/zxing_reader-abc123.wasm')
    expect(locateFile('other.js', 'https://cdn.example/')).toBe('https://cdn.example/other.js')
  })

  it('預設的 WASM 位置是本站資產，不是任何第三方 CDN', () => {
    expect(ZXING_WASM_URL).not.toMatch(/jsdelivr|unpkg|fastly|cdn\./)
    expect(ZXING_WASM_URL).toMatch(/zxing_reader.*\.wasm$/)
  })
})

describe('reader 選項', () => {
  it('只要求 Issue 指定的 6 種格式', () => {
    expect(READER_OPTIONS.formats).toEqual(['QRCode', 'Code128', 'EAN13', 'EAN8', 'Code39', 'ITF14'])
  })

  it('允許一次回報多個碼，否則偵測不到「多碼」狀態', () => {
    expect(READER_OPTIONS.maxNumberOfSymbols).toBeGreaterThan(1)
  })
})

describe('六種支援格式都要能從真圖回讀（PNG）', () => {
  const cases = [
    ['qrcode-url.png', 'qrcode', 'https://www.pocketool.app/qrcode-studio/'],
    ['qrcode-wifi.png', 'qrcode', 'WIFI:T:WPA;S:Cafe\\;Bar;P:p\\:a\\\\ss;H:false;;'],
    ['code128.png', 'code128', 'ABC-12345'],
    ['ean13.png', 'ean13', '4710088331236'],
    ['ean8.png', 'ean8', '55123457'],
    ['code39.png', 'code39', 'ABC-1234'],
    ['itf14.png', 'itf14', '15400141288763'],
  ] as const

  for (const [file, format, text] of cases) {
    it(`${file} → ${format}`, async () => {
      const outcome = toScanOutcome(await decodeFixture(file))
      expect(outcome.status).toBe('single')
      if (outcome.status !== 'single') return
      expect(outcome.result.format).toBe(format)
      expect(outcome.result.text).toBe(text)
    })
  }

  it('WiFi QR 會一路解析成表單資料', async () => {
    const outcome = toScanOutcome(await decodeFixture('qrcode-wifi.png'))
    expect(outcome.status === 'single' && outcome.result.parsed?.kind).toBe('wifi')
    expect(outcome.status === 'single' && outcome.result.parsed?.data).toEqual({
      ssid: 'Cafe;Bar', password: 'p:a\\ss', encryption: 'WPA', hidden: false,
    })
  })
})

describe('有失真壓縮的 JPEG 也要讀得回來', () => {
  for (const [file, text] of [
    ['qrcode-url.jpg', 'https://www.pocketool.app/qrcode-studio/'],
    ['code128.jpg', 'ABC-12345'],
    ['ean13.jpg', '4710088331236'],
    ['ean8.jpg', '55123457'],
    ['code39.jpg', 'ABC-1234'],
    ['itf14.jpg', '15400141288763'],
  ] as const) {
    it(file, async () => {
      // JPEG 沒有 PNG 解碼器可用，這裡直接把檔案 bytes 交給 WASM 自己的影像解碼器。
      // production 不走這條（見下面的 WebP 測試），但它足以證明：六種格式在帶有
      // JPEG 壓縮雜訊的圖上，用我們這組 reader 選項依然讀得回正確內容。
      const results = await decodeImageSource(readFixture(file), offlineOverrides)
      const outcome = toScanOutcome(results)
      expect(outcome.status).toBe('single')
      expect(outcome.status === 'single' && outcome.result.text).toBe(text)
    })
  }
})

describe('WebP 必須先由瀏覽器解成像素，不能把 bytes 丟給 WASM', () => {
  it('zxing-wasm 的影像解碼器讀不懂 WebP：這是 production 走 ImageData 的原因', async () => {
    const results = await decodeImageSource(readFixture('qrcode-url.webp'), offlineOverrides)
    expect(toScanOutcome(results).status).toBe('none')
  })

  it('同一張圖的 PNG 版讀得到，證明差別只在容器而不在內容', async () => {
    expect(toScanOutcome(await decodeFixture('qrcode-url.png')).status).toBe('single')
  })
})

describe('多碼與讀不到', () => {
  it('兩個 QR 的圖會回報 2 個碼，不會只給第一個', async () => {
    const outcome = toScanOutcome(await decodeFixture('multi-qrcode.png'))
    expect(outcome.status).toBe('multiple')
    expect(outcome.status === 'multiple' && outcome.count).toBe(2)
  })

  it('沒有條碼的圖回 none', async () => {
    expect(toScanOutcome(await decodeFixture('no-barcode.png')).status).toBe('none')
  })
})
