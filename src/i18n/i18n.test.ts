/**
 * 中英文版的骨架：成對的頁面、語言切換的目的地、路由的語系、hreflang 與 JSON-LD 跟著語言走。
 * 產物層級（每頁實際輸出的 hreflang、<html lang>、語言切換連結）由 scripts/seo/audit.mjs 驗。
 */
import { describe, it, expect } from 'vitest'
import { routes } from '@/router'
import { PAGE_PAIRS, LOCALE_HOME, pairOf, switchTarget, withTrailingSlash } from './pairs'
import { LANG_TAG, OG_LOCALE, localeOfMeta } from './locale'
import { buildPrimaryLd, buildWebPageLd, hreflangLinks } from '@/composables/useSeoHead'
import { site } from '@/config/site'

describe('成對的頁面', () => {
  it('先做首頁、批次與條碼三頁，路徑帶尾斜線', () => {
    expect(PAGE_PAIRS).toEqual([
      { zh: '/', en: '/en/' },
      { zh: '/batch/', en: '/en/batch/' },
      { zh: '/barcode/', en: '/en/barcode/' },
    ])
    expect(LOCALE_HOME).toEqual({ 'zh-TW': '/', en: '/en/' })
  })

  it('每一組在路由裡都有：繁中沒有 meta.locale，英文是 en', () => {
    for (const pair of PAGE_PAIRS) {
      const zh = routes.find(r => withTrailingSlash(r.path) === pair.zh)
      const en = routes.find(r => withTrailingSlash(r.path) === pair.en)
      expect(zh, pair.zh).toBeDefined()
      expect(en, pair.en).toBeDefined()
      expect(localeOfMeta(zh!.meta)).toBe('zh-TW')
      expect(localeOfMeta(en!.meta)).toBe('en')
    }
  })

  it('英文路由都在成對的表上（沒有落單的英文頁）', () => {
    const enRoutes = routes.filter(r => r.meta?.locale === 'en').map(r => withTrailingSlash(r.path)).sort()
    expect(enRoutes).toEqual(PAGE_PAIRS.map(p => p.en).sort())
  })

  it('有沒有尾斜線、帶 ? 或 # 都認得', () => {
    expect(pairOf('/batch')).toEqual({ zh: '/batch/', en: '/en/batch/' })
    expect(pairOf('/en/barcode/?x=1')).toEqual({ zh: '/barcode/', en: '/en/barcode/' })
    expect(pairOf('/en#top')).toEqual({ zh: '/', en: '/en/' })
    expect(pairOf('/wifi/')).toBeNull()
  })
})

describe('語言切換的目的地', () => {
  it('成對的頁連到另一個語言的同一頁', () => {
    expect(switchTarget('/', 'en')).toBe('/en/')
    expect(switchTarget('/batch/', 'en')).toBe('/en/batch/')
    expect(switchTarget('/en/barcode/', 'zh-TW')).toBe('/barcode/')
  })

  it('沒有對應頁的連到該語言的首頁', () => {
    expect(switchTarget('/wifi/', 'en')).toBe('/en/')
    expect(switchTarget('/guide/qr-code-svg/', 'en')).toBe('/en/')
    expect(switchTarget('/404', 'en')).toBe('/en/')
  })
})

describe('hreflang 與 JSON-LD 跟著語言走', () => {
  it('成對的頁：zh-Hant-TW、en、x-default（指繁中）三條，兩邊一模一樣', () => {
    const zh = hreflangLinks('/batch', 'zh-TW')
    const en = hreflangLinks('/en/batch', 'en')
    expect(zh).toEqual([
      { rel: 'alternate', hreflang: 'zh-Hant-TW', href: `${site.url}/batch/` },
      { rel: 'alternate', hreflang: 'en', href: `${site.url}/en/batch/` },
      { rel: 'alternate', hreflang: 'x-default', href: `${site.url}/batch/` },
    ])
    expect(en).toEqual(zh)
    expect(hreflangLinks('/', 'zh-TW').map(l => l.href)).toEqual([`${site.url}/`, `${site.url}/en/`, `${site.url}/`])
  })

  it('沒有英文版的頁只有指向自己的一條（跟英文版之前一樣）', () => {
    expect(hreflangLinks('/wifi')).toEqual([{ rel: 'alternate', hreflang: 'zh-Hant-TW', href: `${site.url}/wifi/` }])
  })

  it('語言代碼：html lang 與 hreflang 是 zh-Hant-TW／en，og:locale 是 zh_TW／en_US', () => {
    expect(LANG_TAG).toEqual({ 'zh-TW': 'zh-Hant-TW', en: 'en' })
    expect(OG_LOCALE).toEqual({ 'zh-TW': 'zh_TW', en: 'en_US' })
  })

  it('英文工具頁：inLanguage en、價格 0 美元、WebSite 名稱是英文名，繁中名與舊名放在 alternateName', () => {
    const ld = buildPrimaryLd({ title: 't', description: 'd', path: '/en/batch', appName: 'Bulk QR Code and Barcode Generator', appType: 'WebApplication', locale: 'en' }, `${site.url}/en/batch/`, 'x')
    expect(ld).toMatchObject({
      '@type': 'WebApplication', name: 'Bulk QR Code and Barcode Generator', inLanguage: 'en',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@type': 'WebSite', name: 'QR Code Maker', alternateName: ['QR Code 製造機', 'QR Code Studio'], url: `${site.url}/` },
    })
  })

  it('繁中頁照舊：inLanguage zh-Hant-TW、新台幣、WebSite 名稱是 QR Code 製造機', () => {
    const ld = buildPrimaryLd({ title: 't', description: 'd', path: '/batch', appName: '批次產生 QR Code 與條碼' }, `${site.url}/batch/`, 'x')
    expect(ld).toMatchObject({ inLanguage: 'zh-Hant-TW', offers: { priceCurrency: 'TWD' }, isPartOf: { name: 'QR Code 製造機' } })
    expect(buildWebPageLd({ type: 'WebPage', name: 'n', url: 'u', description: 'd' }).inLanguage).toBe('zh-Hant-TW')
  })

  it('英文的站名、og:site_name 與商標聲明', () => {
    expect(site.nameEn).toBe('QR Code Maker')
    expect(site.siteNameEn).toBe('QR Code Maker | Pocketool')
    expect(site.trademarkEn).toBe('QR Code is a registered trademark of DENSO WAVE INCORPORATED in Japan and other countries.')
  })
})
