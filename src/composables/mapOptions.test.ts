import { describe, it, expect } from 'vitest'
import { mapToQrOptions, qrGeometry, SIZE_ERROR } from './useQrCode'
import { defaultStyle } from '@/types'

describe('mapToQrOptions', () => {
  it('基本映射：尺寸、容錯、顏色', () => {
    const o = mapToQrOptions('https://x.com', { ...defaultStyle, width: 500, errorCorrectionLevel: 'H', dotColor: '#000', bgColor: '#fff' })
    expect(o.width).toBe(500)
    expect(o.height).toBe(500)
    expect(o.data).toBe('https://x.com')
    expect(o.qrOptions?.errorCorrectionLevel).toBe('H')
    expect(o.dotsOptions?.color).toBe('#000')
    expect(o.backgroundOptions?.color).toBe('#fff')
  })
  it('透明背景對應 rgba 0 alpha', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, bgColor: 'transparent' })
    expect(o.backgroundOptions?.color).toBe('rgba(0,0,0,0)')
  })
  it('啟用漸層時帶入 gradient', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, useGradient: true, dotColor: '#111', gradientColor: '#4f46e5', gradientType: 'linear' })
    expect(o.dotsOptions?.gradient?.type).toBe('linear')
    expect(o.dotsOptions?.gradient?.colorStops?.[0]?.color).toBe('#111')
    expect(o.dotsOptions?.gradient?.colorStops?.[1]?.color).toBe('#4f46e5')
  })
  it('有 LOGO 時帶入 image 與 imageOptions', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, logoDataUrl: 'data:image/png;base64,AAA', logoSize: 0.25 })
    expect(o.image).toBe('data:image/png;base64,AAA')
    expect(o.imageOptions?.imageSize).toBe(0.25)
    expect(o.imageOptions?.hideBackgroundDots).toBe(true)
  })
  it('無 LOGO 時 image 為 undefined', () => {
    const o = mapToQrOptions('x', { ...defaultStyle, logoDataUrl: null })
    expect(o.image).toBeUndefined()
  })
})

describe('mapToQrOptions 的文字編碼', () => {
  it('中文內容以 UTF-8 位元組字串交給 qr-code-styling', () => {
    const o = mapToQrOptions('你好', defaultStyle)
    expect(o.data).toBe('\xe4\xbd\xa0\xe5\xa5\xbd')
  })
  it('純 ASCII 內容原樣交出', () => {
    expect(mapToQrOptions('https://x.com/?q=1', defaultStyle).data).toBe('https://x.com/?q=1')
  })
})

describe('mapToQrOptions 的四周留白（靜區）', () => {
  it('margin 依模組數算：https://example.com、M、1000 px 是 25 格，每格 30 px，四周留 125 px', () => {
    const style = { ...defaultStyle, width: 1000, errorCorrectionLevel: 'M' as const }
    expect(qrGeometry('https://example.com', style)).toEqual({ size: 1000, moduleCount: 25, moduleSize: 30, margin: 125, quietZone: 125 / 30 })
    expect(mapToQrOptions('https://example.com', style).margin).toBe(125)
  })

  it('外部尺寸維持使用者選的大小，不偷偷放大畫布', () => {
    for (const width of [200, 1000, 2000]) {
      const o = mapToQrOptions('https://example.com', { ...defaultStyle, width })
      expect(o.width).toBe(width)
      expect(o.height).toBe(width)
    }
  })

  it('內容與耐髒程度改變模組數時，留白跟著重算', () => {
    const short = qrGeometry('https://example.com', { ...defaultStyle, errorCorrectionLevel: 'L' })!
    const long = qrGeometry('https://example.com/' + 'a'.repeat(300), { ...defaultStyle, errorCorrectionLevel: 'H' })!
    expect(long.moduleCount).toBeGreaterThan(short.moduleCount)
    expect(short.quietZone).toBeGreaterThanOrEqual(4)
    expect(long.quietZone).toBeGreaterThanOrEqual(4)
  })

  it('連 1 像素的模組都放不下時不輸出（fail closed），不退回固定像素的留白', () => {
    const style = { ...defaultStyle, width: 100, errorCorrectionLevel: 'H' as const }
    const text = 'https://example.com/' + 'a'.repeat(400)
    expect(qrGeometry(text, style)).toBeNull()
    expect(() => mapToQrOptions(text, style)).toThrow(SIZE_ERROR)
  })
})
