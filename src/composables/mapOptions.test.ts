import { describe, it, expect } from 'vitest'
import { mapToQrOptions } from './useQrCode'
import { defaultStyle } from '@/types'

describe('mapToQrOptions', () => {
  it('基本映射：尺寸、容錯、顏色、邊距', () => {
    const o = mapToQrOptions('https://x.com', { ...defaultStyle, width: 500, errorCorrectionLevel: 'H', dotColor: '#000', bgColor: '#fff', margin: 4 })
    expect(o.width).toBe(500)
    expect(o.height).toBe(500)
    expect(o.data).toBe('https://x.com')
    expect(o.margin).toBe(4)
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
