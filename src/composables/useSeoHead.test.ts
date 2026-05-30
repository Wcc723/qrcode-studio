import { describe, it, expect } from 'vitest'
import { buildSoftwareAppLd, buildFaqLd, buildBreadcrumbLd, buildArticleLd } from './useSeoHead'

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
  it('BreadcrumbList 結構正確', () => {
    const ld = buildBreadcrumbLd([
      { name: '首頁', url: 'https://qrtool.example/' },
      { name: 'WiFi QR Code', url: 'https://qrtool.example/wifi/' },
    ])
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement[0].position).toBe(1)
    expect(ld.itemListElement[0].name).toBe('首頁')
    expect(ld.itemListElement[0].item).toBe('https://qrtool.example/')
    expect(ld.itemListElement[1].position).toBe(2)
    expect(ld.itemListElement[1].name).toBe('WiFi QR Code')
    expect(ld.itemListElement[1].item).toBe('https://qrtool.example/wifi/')
  })
  it('Article 結構正確', () => {
    const ld = buildArticleLd({ title: '什麼是 QR Code', url: 'https://qrtool.example/guide/what-is-qr-code/', description: 'desc' })
    expect(ld['@type']).toBe('Article')
    expect(ld.headline).toBe('什麼是 QR Code')
    expect(ld.mainEntityOfPage['@id']).toBe('https://qrtool.example/guide/what-is-qr-code/')
    expect(ld.inLanguage).toBe('zh-Hant-TW')
  })
})
