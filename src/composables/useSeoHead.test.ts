import { describe, it, expect } from 'vitest'
import { buildSoftwareAppLd, buildFaqLd } from './useSeoHead'

describe('JSON-LD builders', () => {
  it('SoftwareApplication 結構正確', () => {
    const ld = buildSoftwareAppLd({ name: 'QRTool', url: 'https://x.tw/url', description: 'desc' })
    expect(ld['@type']).toBe('SoftwareApplication')
    expect(ld.offers.price).toBe('0')
    expect(ld.applicationCategory).toBe('UtilitiesApplication')
  })
  it('FAQPage 結構正確', () => {
    const ld = buildFaqLd([{ q: '問?', a: '答' }])
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('答')
  })
})
