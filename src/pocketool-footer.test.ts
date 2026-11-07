/**
 * 頁尾換成口袋工具站群共用頁尾（src/shared/pocketool-footer/，同步來的拷貝）：中英兩種頁尾各掛一次，
 * 先跑它附的 pocketoolFooterProblems（互連列、網站資訊、版權句、署名的字與網址都照它的資料檔對），
 * 再鎖住本站自己的幾件事：互連列九站的順序與網址、本站標 aria-current、英文頁的字、
 * 語系列（中文、English，去處跟頁首的語言切換相同）、
 * 本站專屬區放站內連結與回報問題與商標聲明，跟共用部分重複的東西（連回口袋工具、聯絡、版權句、署名）不再出現第二份。
 * 英文頁頁尾「沒有中文」的檢查跟 seo:audit 用同一支（scripts/seo/footer-languages.mjs），這裡另外驗它的例外只放行語系列的語名。
 * 產物層級（每一個有 <footer> 的預渲染 HTML，含 404）由 scripts/seo/audit.mjs 驗。
 */
import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, provide, readonly, ref } from 'vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import DefaultLayout from './layouts/DefaultLayout.vue'
import { LANG_TAG, LANGUAGE_NAME, LOCALE_KEY, LOCALES, type Locale } from './i18n/locale'
import { publisher, site } from './config/site'
import { pocketoolFooterProblems } from './shared/pocketool-footer/pocketool-footer.audit.mjs'
import { POCKETOOL_FOOTER_VERSION, type PocketoolFooterLanguageInput } from './shared/pocketool-footer/pocketool-footer-data.mjs'

const root = join(import.meta.dirname, '..')
// seo:audit 用的語系列期望值與英文頁頁尾的中文檢查（純 JS、沒有型別宣告），用動態 import 讀進來
const { FOOTER_LANGUAGES, expectedFooterLanguages, englishFooterChinese } = (await import(pathToFileURL(join(root, 'scripts/seo/footer-languages.mjs')).href)) as {
  FOOTER_LANGUAGES: { lang: string, label: string }[]
  expectedFooterLanguages: (pageLang: string, otherHref: string) => PocketoolFooterLanguageInput[]
  englishFooterChinese: (html: string) => string[]
}

const RouterLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const wrappers: VueWrapper[] = []
/** switchTo 是 App.vue 算好的語言切換去處（測試沒有 router，自己給）；測試環境的 BASE_URL 是 /，頁尾的去處跟它一樣 */
function mountWith(locale: Locale, switchTo = locale === 'en' ? '/' : '/en/') {
  const Wrap = defineComponent({
    setup() {
      provide(LOCALE_KEY, readonly(ref(locale)))
      return () => h(DefaultLayout, { switchTo })
    },
  })
  const w = mount(Wrap, { global: { stubs: { RouterLink: RouterLinkStub } }, attachTo: document.body })
  wrappers.push(w)
  return w
}
afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
  document.body.innerHTML = ''
})

const footerOf = (w: VueWrapper) => {
  const footers = w.findAll('footer')
  expect(footers).toHaveLength(1)
  return footers[0]!.element as HTMLElement
}
const pairs = (links: Iterable<Element>) => [...links].map((a) => [a.querySelector('.ptf-site__name')?.textContent ?? a.textContent, a.getAttribute('href')])
/**
 * 拿掉 lang="zh-Hant" 的元素（站名沒有外文名的站、署名）之後還剩下的字。語系列的一筆只在沒有子元素、
 * 字剛好是它 lang 那個語言的語名時才拿掉字（英文頁上的「中文」），對不上就照樣留著
 */
const NAME_OF_LANG = new Map(LOCALES.map((l) => [LANG_TAG[l], LANGUAGE_NAME[l]]))
const textWithoutZh = (el: HTMLElement) => {
  const copy = el.cloneNode(true) as HTMLElement
  for (const zh of copy.querySelectorAll('[lang="zh-Hant"]')) zh.remove()
  for (const item of copy.querySelectorAll('[data-ptf-lang]')) {
    if (item.children.length === 0 && item.textContent?.trim() === NAME_OF_LANG.get(item.getAttribute('lang') ?? '')) item.textContent = ''
  }
  return copy.textContent ?? ''
}
const CJK = /[\p{Script=Han}　-〿＀-￯]/u

describe('繁中頁尾', () => {
  it('照共用頁尾的契約：pocketoolFooterProblems 沒有問題，版本跟資料檔一樣', () => {
    const w = mountWith('zh-TW')
    expect(pocketoolFooterProblems(w.html({ raw: true }), { site: 'qrcode-studio', locale: 'zh-Hant', languages: expectedFooterLanguages('zh-Hant-TW', '/en/') })).toEqual([])
    const footer = footerOf(w)
    expect(footer.getAttribute('data-pocketool-footer')).toBe(POCKETOOL_FOOTER_VERSION)
    // 繁中頁不另標 lang（只有簡中頁會標）
    expect(footer.hasAttribute('lang')).toBe(false)
  })

  it('互連列是九個站，QR Code 製造機標 aria-current="true"（頁尾的連結只有這一個；另一個是語系列的目前語言）', () => {
    const footer = footerOf(mountWith('zh-TW'))
    const sites = footer.querySelector('nav[aria-label="口袋工具的站"]')!
    expect(pairs(sites.querySelectorAll('a'))).toEqual([
      ['口袋工具', 'https://www.pocketool.app/'],
      ['口袋時間', 'https://www.pocketool.app/time/zh-tw/'],
      ['社畜人生計算機', 'https://www.pocketool.app/compound-calculator/'],
      ['行政小幫手', 'https://www.pocketool.app/office-tools/'],
      ['台灣郵遞區號查詢', 'https://www.pocketool.app/zipcode/'],
      [site.name, 'https://www.pocketool.app/qrcode-studio/'],
      ['顏文字花園', 'https://www.pocketool.app/kaomoji/zh'],
      ['Pixel Smith', 'https://www.pocketool.app/pixel-smith/'],
      ['Device Tester', 'https://www.pocketool.app/device-tester/zh-tw/'],
    ])
    const current = footer.querySelectorAll('a[aria-current]')
    expect(current).toHaveLength(1)
    expect(current[0]!.getAttribute('aria-current')).toBe('true')
    expect(current[0]!.getAttribute('href')).toBe('https://www.pocketool.app/qrcode-studio/')
    // 連結以外帶 aria-current 的只有語系列的目前語言（純文字的 span）
    expect([...footer.querySelectorAll('[aria-current]:not(a)')].map((el) => [el.tagName, el.textContent])).toEqual([['SPAN', '中文']])
    // 全繁中頁：互連列都不必標 hreflang、不另開分頁
    for (const a of sites.querySelectorAll('a')) {
      expect(a.hasAttribute('hreflang')).toBe(false)
      expect(a.hasAttribute('target')).toBe(false)
    }
  })

  it('本站專屬區在互連列上面：站內連結、回報問題、隱私那一行與商標聲明', () => {
    const footer = footerOf(mountWith('zh-TW'))
    const local = footer.querySelector('.ptf__local')!
    expect(local).not.toBeNull()
    expect(local.compareDocumentPosition(footer.querySelector('nav[aria-label="口袋工具的站"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect([...local.querySelectorAll('h2')].map((el) => el.textContent)).toEqual(['QR Code 類型', '其他工具', '教學', '關於'])
    const hrefs = [...local.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/url/', '/scan/', '/barcode/', '/batch/', '/guide/', '/about/', '/faq/', '/privacy/', publisher.toolsUrl]))
    expect(local.querySelector('[data-test="report-link"]')!.getAttribute('href')).toBe(publisher.reportUrl)
    // 本站的隱私權頁跟共用部分的口袋工具隱私權政策分得出來；關於頁照舊叫「關於 QR Code 製造機」
    expect(local.querySelector('a[href="/privacy/"]')!.textContent).toBe('本工具隱私權政策')
    expect(local.querySelector('a[href="/about/"]')!.textContent).toBe(`關於 ${site.name}`)
    expect(local.querySelector('[data-test="trademark"]')!.textContent).toBe(site.trademark)
    expect(local.textContent).toContain('瀏覽器內生成，內容不傳雲端')
  })

  it('跟共用部分重複的不再出現第二份：本站專屬區沒有連回口袋工具首頁、聯絡、版權句與署名', () => {
    const local = footerOf(mountWith('zh-TW')).querySelector('.ptf__local')!
    const hrefs = [...local.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).not.toContain(publisher.url)
    expect(hrefs).not.toContain(publisher.contactUrl)
    expect(local.textContent).not.toContain('©')
    expect(local.textContent).not.toContain('出品')
    expect(local.querySelector('[data-owner-line]')).toBeNull()
  })
})

describe('英文頁尾', () => {
  it('照共用頁尾的契約：pocketoolFooterProblems 沒有問題（英文的字、連 hub 的英文頁）', () => {
    const w = mountWith('en')
    expect(pocketoolFooterProblems(w.html({ raw: true }), { site: 'qrcode-studio', locale: 'en', languages: expectedFooterLanguages('en', '/') })).toEqual([])
    const footer = footerOf(w)
    expect(footer.hasAttribute('lang')).toBe(false)
    expect([...footer.querySelectorAll('nav[aria-label="Site information"] a')].map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['About', 'https://www.pocketool.app/en/about'],
      ['Editorial Policy', 'https://www.pocketool.app/en/editorial-policy'],
      ['Privacy Policy', 'https://www.pocketool.app/en/privacy'],
      ['Terms of Service', 'https://www.pocketool.app/en/terms'],
      ['Disclaimer', 'https://www.pocketool.app/en/disclaimer'],
      ['Contact', 'https://www.pocketool.app/en/contact'],
      ['Casper Blog', 'https://www.casper.tw/'],
    ])
  })

  it('互連列用英文站名，QR Code Maker 與 Kaomoji Garden 連英文版，本站標 aria-current；英文版不放的站連繁中並標 hreflang', () => {
    const footer = footerOf(mountWith('en'))
    const sites = footer.querySelector('nav[aria-label="Pocketool sites"]')!
    expect(sites.querySelectorAll('a')).toHaveLength(9)
    const current = footer.querySelectorAll('a[aria-current]')
    expect(current).toHaveLength(1)
    expect(current[0]!.getAttribute('aria-current')).toBe('true')
    expect(current[0]!.querySelector('.ptf-site__name')!.textContent).toBe(site.nameEn)
    expect(current[0]!.getAttribute('href')).toBe('https://www.pocketool.app/qrcode-studio/en/')
    expect(current[0]!.hasAttribute('hreflang')).toBe(false)
    // 行政小幫手的英文版是 noindex，不放（共用頁尾 1.2.0 起）：連繁中版、標 hreflang，站名照用英文
    const officeTools = sites.querySelector('a[href="https://www.pocketool.app/office-tools/"]')!
    expect(officeTools.querySelector('.ptf-site__name')!.textContent).toBe('Office Tools')
    expect(officeTools.querySelector('.ptf-site__name')!.hasAttribute('lang')).toBe(false)
    expect(officeTools.querySelector('.ptf-site__desc')!.textContent).toBe('Admin tools for Taiwan offices')
    expect(officeTools.getAttribute('hreflang')).toBe('zh-Hant')
    expect(sites.querySelector('a[href="https://www.pocketool.app/office-tools/en/"]')).toBeNull()
    // 顏文字花園有英文版：連英文版、不標 hreflang
    const kaomoji = sites.querySelector('a[href="https://www.pocketool.app/kaomoji/en"]')!
    expect(kaomoji.querySelector('.ptf-site__name')!.textContent).toBe('Kaomoji Garden')
    expect(kaomoji.hasAttribute('hreflang')).toBe(false)
    const pocketTime = sites.querySelector('a[href="https://www.pocketool.app/time/zh-tw/"]')!
    expect(pocketTime.querySelector('.ptf-site__name')!.textContent).toBe('Pocket Time')
    expect(pocketTime.getAttribute('hreflang')).toBe('zh-Hant')
    // 郵遞區號沒有英文站名：站名標 lang="zh-Hant"
    const zipcode = sites.querySelector('a[href="https://www.pocketool.app/zipcode/"]')!
    expect(zipcode.getAttribute('hreflang')).toBe('zh-Hant')
    expect(zipcode.querySelector('.ptf-site__name')!.getAttribute('lang')).toBe('zh-Hant')
  })

  it('除了標 lang="zh-Hant" 的站名、署名與語系列的「中文」，頁尾沒有中文與全形標點', () => {
    const w = mountWith('en')
    const footer = footerOf(w)
    const rest = textWithoutZh(footer)
    expect(rest.match(/[^\s]*[\p{Script=Han}　-〿＀-￯][^\s]*/u)?.[0]).toBeUndefined()
    expect(CJK.test(rest)).toBe(false)
    expect(CJK.test(footer.textContent ?? '')).toBe(true)
    // seo:audit 用的同一支檢查也過
    expect(englishFooterChinese(w.html({ raw: true }))).toEqual([])
  })

  it('本站專屬區：英文的站內連結、In Chinese only、回報問題與英文的商標聲明；不再重複 Pocketool、Privacy policy、Contact', () => {
    const local = footerOf(mountWith('en')).querySelector('.ptf__local')!
    expect([...local.querySelectorAll('h2')].map((el) => el.textContent)).toEqual(['Free tools', 'In Chinese only', 'About'])
    expect(local.querySelector('[data-test="report-link"]')!.getAttribute('href')).toBe(publisher.reportUrlEn)
    expect(local.querySelector('[data-test="trademark"]')!.textContent).toBe(site.trademarkEn)
    const hrefs = [...local.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/en/', '/en/batch/', '/en/barcode/', publisher.toolsUrlEn, publisher.aboutToolUrlEn]))
    expect(hrefs).not.toContain(publisher.urlEn)
    expect(hrefs).not.toContain(publisher.privacyUrlEn)
    expect(hrefs).not.toContain('https://www.pocketool.app/en/contact')
    expect(local.textContent).not.toContain('©')
    expect(local.textContent).not.toContain('Made by')
  })
})

describe('語系列', () => {
  /** 語系列每一筆：[標籤, 字, lang, href, hreflang, aria-current] */
  const rowOf = (footer: HTMLElement) => [...footer.querySelectorAll('.ptf__langs [data-ptf-lang]')].map((el) =>
    [el.tagName, el.textContent, el.getAttribute('lang'), el.getAttribute('href'), el.getAttribute('hreflang'), el.getAttribute('aria-current')])

  it('seo:audit 的期望值跟元件用的語名、lang 是同一組（中文、English，繁中在前）', () => {
    expect(FOOTER_LANGUAGES).toEqual(LOCALES.map((l) => ({ lang: LANG_TAG[l], label: LANGUAGE_NAME[l] })))
  })

  it('繁中頁：中文是目前的語言（純文字），English 連到頁首語言切換的同一個去處', () => {
    const w = mountWith('zh-TW', '/en/batch/')
    const footer = footerOf(w)
    expect(rowOf(footer)).toEqual([
      ['SPAN', '中文', 'zh-Hant-TW', null, null, 'true'],
      ['A', 'English', 'en', '/en/batch/', 'en', null],
    ])
    const english = footer.querySelector('.ptf__langs a')!
    for (const test of ['lang-switch', 'lang-switch-mobile']) {
      const header = w.find(`[data-test="${test}"]`)
      expect(header.attributes('href'), test).toBe(english.getAttribute('href'))
      expect(header.attributes('hreflang'), test).toBe(english.getAttribute('hreflang'))
    }
    // 一般 <a>：同分頁開、整頁換頁
    expect(english.hasAttribute('target')).toBe(false)
    expect(english.hasAttribute('rel')).toBe(false)
    expect(pocketoolFooterProblems(w.html({ raw: true }), { site: 'qrcode-studio', locale: 'zh-Hant', languages: expectedFooterLanguages('zh-Hant-TW', '/en/batch/') })).toEqual([])
  })

  it('英文頁：中文連到頁首語言切換的同一個去處，English 是目前的語言', () => {
    const w = mountWith('en', '/barcode/')
    const footer = footerOf(w)
    expect(rowOf(footer)).toEqual([
      ['A', '中文', 'zh-Hant-TW', '/barcode/', 'zh-Hant-TW', null],
      ['SPAN', 'English', 'en', null, null, 'true'],
    ])
    const chinese = footer.querySelector('.ptf__langs a')!
    for (const test of ['lang-switch', 'lang-switch-mobile']) {
      const header = w.find(`[data-test="${test}"]`)
      expect(header.attributes('href'), test).toBe(chinese.getAttribute('href'))
      expect(header.attributes('hreflang'), test).toBe(chinese.getAttribute('hreflang'))
    }
    expect(pocketoolFooterProblems(w.html({ raw: true }), { site: 'qrcode-studio', locale: 'en', languages: expectedFooterLanguages('en', '/barcode/') })).toEqual([])
  })

  it('去處跟頁首不一樣時，帶 languages 的稽核會擋', () => {
    const w = mountWith('zh-TW', '/en/batch/')
    expect(pocketoolFooterProblems(w.html({ raw: true }), { site: 'qrcode-studio', locale: 'zh-Hant', languages: expectedFooterLanguages('zh-Hant-TW', '/en/') })).not.toEqual([])
  })
})

describe('英文頁頁尾的中文檢查（seo:audit 的 englishFooterChinese）只放行語系列的語名', () => {
  const VERSION = POCKETOOL_FOOTER_VERSION
  /** 只有語系列的最小頁尾：中文是連結、English 是目前的語言 */
  const footer = (chinese: string, after = '') => `<html lang="en"><body><header><a href="/qrcode-studio/" lang="zh-Hant-TW">中文</a></header>`
    + `<footer class="ptf" data-pocketool-footer="${VERSION}"><nav class="ptf__langs" aria-label="Language"><ul>`
    + `<li>${chinese}</li>`
    + `<li><span class="ptf__lang ptf__lang--current" lang="en" data-ptf-lang aria-current="true">English</span></li>`
    + `</ul></nav>${after}</footer></body></html>`
  const ok = '<a class="ptf__lang" href="/qrcode-studio/" lang="zh-Hant-TW" hreflang="zh-Hant-TW" data-ptf-lang>中文</a>'

  it('帶 data-ptf-lang、lang 對、沒有子標籤、字剛好是語名的那一筆不算（頁首的「中文」在頁尾外面，不看）', () => {
    expect(englishFooterChinese(footer(ok))).toEqual([])
    expect(englishFooterChinese(footer(ok.replace('data-ptf-lang>', 'data-ptf-lang="">')))).toEqual([])
  })

  it('字多一點、lang 不對、包了子標籤、沒有 data-ptf-lang 都照查', () => {
    expect(englishFooterChinese(footer(ok.replace('>中文<', '>中文版<')))).toEqual(['中文版'])
    expect(englishFooterChinese(footer(ok.replace(' lang="zh-Hant-TW"', ' lang="en"')))).toEqual(['中文'])
    expect(englishFooterChinese(footer(ok.replace(' lang="zh-Hant-TW"', ' lang="zh-Hant"')))).toEqual(['中文'])
    expect(englishFooterChinese(footer(ok.replace('>中文<', '><b>中文</b><')))).toEqual(['中文'])
    expect(englishFooterChinese(footer(ok.replace(' data-ptf-lang', '')))).toEqual(['中文'])
  })

  it('只拿掉字：語系列那一筆的 title、aria-label 照查；語系列外面的「中文」照查', () => {
    expect(englishFooterChinese(footer(ok.replace(' data-ptf-lang', ' data-ptf-lang title="切換到中文"')))).toEqual(['切換到中文'])
    expect(englishFooterChinese(footer(ok, '<p class="ptf__copy">中文</p>'))).toEqual(['中文'])
  })
})

describe('樣式', () => {
  const read = (rel: string) => readFileSync(join(import.meta.dirname, rel), 'utf8')

  it('本站專屬區的連結沒有小於 16px 的字（不用 text-xs、text-sm），任何寬度每個連結都至少 44px 高', () => {
    const layout = read('layouts/DefaultLayout.vue')
    const footer = layout.slice(layout.indexOf('<PocketoolFooter '), layout.indexOf('</PocketoolFooter>'))
    expect(footer).not.toMatch(/\btext-(xs|sm)\b|text-\[\d+px\]/)
    expect(layout).toMatch(/const footLink = '[^']*\bmin-h-11\b/)
    // 寬螢幕也不縮回去（不寫 md:min-h-0 這類覆蓋）
    expect(layout).not.toMatch(/const footLink = '[^']*\b\w+:min-h-/)
    expect((footer.match(/<(RouterLink|a)\b/g) ?? []).length).toBe((footer.match(/:class="(footLink|\[footLink)/g) ?? []).length)
  })

  it('--ptf-* 變數對到本站色票，main.ts 有載入這份樣式', () => {
    const css = read('styles/pocketool-footer.css')
    for (const name of ['bg', 'ink', 'ink-2', 'line', 'border-top', 'line-strong', 'link-hover', 'font', 'font-brand', 'max-width', 'gutter', 'gutter-wide']) {
      expect(css, name).toMatch(new RegExp(`--ptf-${name}:`))
    }
    // 只設變數，不用更高的選擇器去蓋元件自己的樣式
    expect(css).not.toMatch(/\.ptf\b/)
    expect(read('main.ts')).toContain("import './styles/pocketool-footer.css'")
  })
})
