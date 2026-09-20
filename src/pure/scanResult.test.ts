import { describe, it, expect } from 'vitest'
import { toScanOutcome } from './scanResult'

const raw = (format: string, text: string) => ({ format, text })

describe('沒有讀到任何條碼', () => {
  it('空陣列回 none', () => {
    expect(toScanOutcome([]).status).toBe('none')
  })

  it('zxing 有時會回一筆空結果（例如容器格式不支援），不算讀到', () => {
    expect(toScanOutcome([raw('None', ''), raw('', '')]).status).toBe('none')
  })
})

describe('單一支援格式', () => {
  it('回 single，附格式 id、可讀標籤與原文', () => {
    const outcome = toScanOutcome([raw('QRCode', 'https://example.com/')])
    expect(outcome.status).toBe('single')
    if (outcome.status !== 'single') return
    expect(outcome.result.format).toBe('qrcode')
    expect(outcome.result.formatLabel).toBe('QR Code')
    expect(outcome.result.text).toBe('https://example.com/')
    expect(outcome.result.isLinear).toBe(false)
  })

  it('QR 會解析出結構化 payload，一維碼不解析', () => {
    const qr = toScanOutcome([raw('QRCode', 'WIFI:T:WPA;S:Cafe;P:pw;H:false;;')])
    expect(qr.status === 'single' && qr.result.parsed?.kind).toBe('wifi')

    const linear = toScanOutcome([raw('Code128', 'WIFI:T:WPA;S:Cafe;P:pw;H:false;;')])
    expect(linear.status === 'single' && linear.result.parsed).toBeNull()
    expect(linear.status === 'single' && linear.result.isLinear).toBe(true)
  })

  it('不論哪種格式都會判定 URL 能不能安全開啟', () => {
    const safe = toScanOutcome([raw('Code128', 'https://example.com/a')])
    expect(safe.status === 'single' && safe.result.uri.openable).toBe(true)
    const unsafe = toScanOutcome([raw('QRCode', 'javascript:alert(1)')])
    expect(unsafe.status === 'single' && unsafe.result.uri.openable).toBe(false)
    expect(unsafe.status === 'single' && unsafe.result.uri.scheme).toBe('javascript')
  })

  it('同一個碼被回報兩次（格式與內容都相同）視為一個', () => {
    const outcome = toScanOutcome([raw('QRCode', 'hello'), raw('QRCode', 'hello')])
    expect(outcome.status).toBe('single')
  })
})

describe('讀到的碼不在支援清單內', () => {
  it('只有不支援的格式時回 unsupported，並列出偵測到的原始格式名', () => {
    const outcome = toScanOutcome([raw('DataMatrix', 'x')])
    expect(outcome.status).toBe('unsupported')
    expect(outcome.status === 'unsupported' && outcome.detectedFormats).toEqual(['DataMatrix'])
  })

  it('讀到多個但全都不支援時仍回 unsupported：裁切成單碼也一樣讀不了', () => {
    const outcome = toScanOutcome([raw('DataMatrix', 'x'), raw('UPCE', '01234565')])
    expect(outcome.status).toBe('unsupported')
    expect(outcome.status === 'unsupported' && outcome.detectedFormats).toEqual(['DataMatrix', 'UPCE'])
  })

  it('ITF 但不是 14 位數字時也算不支援，不會被當成 ITF-14', () => {
    const outcome = toScanOutcome([raw('ITF', '1234567890')])
    expect(outcome.status).toBe('unsupported')
  })
})

describe('多碼圖片', () => {
  it('偵測到兩個以上就回 multiple，不默默挑第一個', () => {
    const outcome = toScanOutcome([raw('QRCode', 'a'), raw('QRCode', 'b')])
    expect(outcome.status).toBe('multiple')
    expect(outcome.status === 'multiple' && outcome.count).toBe(2)
  })

  it('multiple 不提供任何單一結果，呼叫端沒有東西可以誤用', () => {
    const outcome = toScanOutcome([raw('QRCode', 'a'), raw('Code128', 'B')])
    expect(outcome.status === 'multiple' && 'result' in outcome).toBe(false)
  })

  it('支援與不支援混在一起，只要總數 ≥ 2 就是多碼', () => {
    const outcome = toScanOutcome([raw('QRCode', 'a'), raw('DataMatrix', 'b')])
    expect(outcome.status).toBe('multiple')
    expect(outcome.status === 'multiple' && outcome.count).toBe(2)
  })

  it('multiple 會列出可辨識到的格式標籤供說明用', () => {
    const outcome = toScanOutcome([raw('QRCode', 'a'), raw('EAN13', '4710088331236')])
    expect(outcome.status === 'multiple' && outcome.formatLabels).toEqual(['QR Code', 'EAN-13'])
  })
})
