import { describe, it, expect } from 'vitest'
import {
  buildSoftwareAppLd, buildBreadcrumbLd, buildArticleLd, buildWebPageLd, buildOrganizationLd,
  buildPrimaryLd, canonicalUrl,
} from './useSeoHead'
import { site, publisher } from '@/config/site'

describe('品牌', () => {
  it('產品名是 QR Code 製造機（英文 QR Code Maker），舊名只留在 formerNames，QRTool 不再出現', () => {
    expect(site.name).toBe('QR Code 製造機')
    expect(site.nameEn).toBe('QR Code Maker')
    expect(site.siteName).toBe('QR Code 製造機｜口袋工具')
    expect(site.formerNames).toEqual(['QR Code Studio'])
    const { formerNames: _formerNames, ...rest } = site
    expect(JSON.stringify(rest)).not.toContain('QR Code Studio')
    expect(JSON.stringify(site)).not.toContain('QRTool')
  })
  it('名稱含 QR Code，附 DENSO WAVE 的註冊商標聲明', () => {
    expect(site.trademark).toBe('QR Code 是 DENSO WAVE INCORPORATED 在日本及其他國家的註冊商標。')
  })
})

describe('JSON-LD builders', () => {
  it('SoftwareApplication 結構正確', () => {
    const ld = buildSoftwareAppLd({ name: '網址 QR Code 產生器', url: 'https://x.tw/url', description: 'desc' })
    expect(ld['@type']).toBe('SoftwareApplication')
    expect(ld.offers.price).toBe('0')
    expect(ld.applicationCategory).toBe('UtilitiesApplication')
    expect(ld.publisher.name).toBe('口袋工具 Pocketool')
  })
  it('appType 可改成 WebApplication（/barcode/ 用）', () => {
    const ld = buildSoftwareAppLd({ name: '一維條碼產生器', url: 'https://x.tw/barcode/', description: 'desc', appType: 'WebApplication' })
    expect(ld['@type']).toBe('WebApplication')
    expect(ld.offers.price).toBe('0')
  })
  it('未指定 appType 時維持 SoftwareApplication', () => {
    const ld = buildSoftwareAppLd({ name: 'QR Code 製造機', url: 'https://x.tw/url', description: 'desc' })
    expect(ld['@type']).toBe('SoftwareApplication')
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
  it('Article 帶日期、圖片、真人作者與營運者', () => {
    const ld = buildArticleLd({
      title: '什麼是 QR Code', url: 'https://qrtool.example/guide/what-is-qr-code/', description: 'desc',
      published: '2026-05-29', modified: '2026-09-21', image: 'https://qrtool.example/og.png',
    })
    expect(ld['@type']).toBe('Article')
    expect(ld.headline).toBe('什麼是 QR Code')
    expect(ld.mainEntityOfPage['@id']).toBe('https://qrtool.example/guide/what-is-qr-code/')
    expect(ld.inLanguage).toBe('zh-Hant-TW')
    expect(ld.datePublished).toBe('2026-05-29')
    expect(ld.dateModified).toBe('2026-09-21')
    expect(ld.image).toEqual(['https://qrtool.example/og.png'])
    expect(ld.author).toEqual({ '@type': 'Person', name: '卡斯伯', url: 'https://www.pocketool.app/about' })
    expect(ld.publisher['@type']).toBe('Organization')
    expect(ld.publisher.name).toBe('口袋工具 Pocketool')
    expect(ld.publisher.logo.url).toBe(publisher.logo)
  })
  it('WebPage 系列可指定 AboutPage', () => {
    const ld = buildWebPageLd({ type: 'AboutPage', name: '關於', url: 'https://x.tw/about/', description: 'd' })
    expect(ld['@type']).toBe('AboutPage')
    expect(ld.isPartOf).toEqual({
      '@type': 'WebSite', name: 'QR Code 製造機', alternateName: ['QR Code Maker', 'QR Code Studio'], url: `${site.url}/`,
    })
  })
  it('Organization 是口袋工具（hub），logo 是方形 PNG', () => {
    const ld = buildOrganizationLd()
    expect(ld).toEqual({
      '@context': 'https://schema.org', '@type': 'Organization',
      name: '口袋工具 Pocketool', url: 'https://www.pocketool.app/', logo: `${site.url}/pocketool-logo.png`,
    })
  })
})

describe('useSeoHead 的頁面類型', () => {
  const url = 'https://x.tw/p/'
  const img = 'https://x.tw/og.png'
  it('預設是工具頁，JSON-LD name 用 appName 而不是 <title>', () => {
    const ld = buildPrimaryLd({ title: '網址轉 QR Code｜長長的 SEO 標題', description: 'd', path: '/url', appName: '網址 QR Code 產生器' }, url, img)
    expect(ld['@type']).toBe('SoftwareApplication')
    expect('name' in ld && ld.name).toBe('網址 QR Code 產生器')
  })
  it('page 預設 WebPage，可改 AboutPage', () => {
    expect(buildPrimaryLd({ title: 't', description: 'd', path: '/faq', kind: 'page' }, url, img)['@type']).toBe('WebPage')
    expect(buildPrimaryLd({ title: 't', description: 'd', path: '/about', kind: 'page', pageType: 'AboutPage' }, url, img)['@type']).toBe('AboutPage')
  })
  it('article 沒給日期就拋錯，避免輸出沒有日期的文章', () => {
    expect(() => buildPrimaryLd({ title: 't', description: 'd', path: '/guide/x', kind: 'article' }, url, img)).toThrow()
  })
  it('canonical 一律帶尾斜線', () => {
    expect(canonicalUrl('/')).toBe(`${site.url}/`)
    expect(canonicalUrl('/wifi')).toBe(`${site.url}/wifi/`)
    expect(canonicalUrl('/guide/x/')).toBe(`${site.url}/guide/x/`)
  })
})
