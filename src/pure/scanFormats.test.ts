import { describe, it, expect } from 'vitest'
import { barcodeFormats } from 'zxing-wasm/reader'
import {
  SCAN_FORMATS, READER_FORMATS, toScanFormat, scanFormatLabel,
  isLinearScanFormat, scanFormatToSymbology,
} from './scanFormats'

describe('支援的解碼格式清單', () => {
  it('恰好是 Issue 指定的 6 種，順序固定', () => {
    expect([...SCAN_FORMATS]).toEqual(['qrcode', 'code128', 'ean13', 'ean8', 'code39', 'itf14'])
  })

  it('送給 reader 的 formats 是 zxing-wasm 認得的正式名稱', () => {
    // 對帳來源是套件自己 export 的 barcodeFormats，不是文件抄寫。
    for (const f of READER_FORMATS) expect(barcodeFormats).toContain(f)
  })

  it('送給 reader 的 formats 與支援清單一一對應', () => {
    expect(READER_FORMATS).toEqual(['QRCode', 'Code128', 'EAN13', 'EAN8', 'Code39', 'ITF14'])
  })
})

describe('zxing 回傳格式 → 站內格式 id', () => {
  it('對應 6 種支援格式', () => {
    expect(toScanFormat('QRCode', 'hello')).toBe('qrcode')
    expect(toScanFormat('Code128', 'ABC-12345')).toBe('code128')
    expect(toScanFormat('EAN13', '4710088331236')).toBe('ean13')
    expect(toScanFormat('EAN8', '55123457')).toBe('ean8')
    expect(toScanFormat('Code39', 'ABC-1234')).toBe('code39')
  })

  it('Code 39 的子格式都併回 code39', () => {
    // 實測：Code 39 Extended 的圖回讀 format 是 Code39Ext。
    expect(toScanFormat('Code39Std', 'ABC')).toBe('code39')
    expect(toScanFormat('Code39Ext', 'abc')).toBe('code39')
  })

  it('ITF 必須是 14 位數字才算 ITF-14', () => {
    // 實測：ITF-14 的圖回讀 format 是 ITF（不是 ITF14），10 位 ITF 也是 ITF。
    // 只信 format 名會把任意長度的 ITF 誤標成 ITF-14。
    expect(toScanFormat('ITF', '15400141288763')).toBe('itf14')
    expect(toScanFormat('ITF14', '15400141288763')).toBe('itf14')
    expect(toScanFormat('ITF', '1234567890')).toBeNull()
    expect(toScanFormat('ITF', '1540014128876A')).toBeNull()
  })

  it('不在支援清單內的格式一律回 null，不猜、不降級', () => {
    for (const f of ['UPCA', 'UPCE', 'DataMatrix', 'Aztec', 'PDF417', 'Code93', 'Codabar', 'None', '']) {
      expect(toScanFormat(f, 'whatever')).toBeNull()
    }
  })
})

describe('格式標籤與分類', () => {
  it('每個支援格式都有中文可讀標籤', () => {
    expect(scanFormatLabel('qrcode')).toBe('QR Code')
    expect(scanFormatLabel('code128')).toBe('Code 128')
    expect(scanFormatLabel('ean13')).toBe('EAN-13')
    expect(scanFormatLabel('ean8')).toBe('EAN-8')
    expect(scanFormatLabel('code39')).toBe('Code 39')
    expect(scanFormatLabel('itf14')).toBe('ITF-14')
  })

  it('只有 QR Code 不是一維碼', () => {
    expect(isLinearScanFormat('qrcode')).toBe(false)
    for (const f of ['code128', 'ean13', 'ean8', 'code39', 'itf14'] as const) {
      expect(isLinearScanFormat(f)).toBe(true)
    }
  })

  it('一維碼 id 直接對得上站內 BarcodeSymbology，QR Code 沒有對應', () => {
    expect(scanFormatToSymbology('code128')).toBe('code128')
    expect(scanFormatToSymbology('ean13')).toBe('ean13')
    expect(scanFormatToSymbology('ean8')).toBe('ean8')
    expect(scanFormatToSymbology('code39')).toBe('code39')
    expect(scanFormatToSymbology('itf14')).toBe('itf14')
    expect(scanFormatToSymbology('qrcode')).toBeNull()
  })
})
