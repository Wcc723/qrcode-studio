/**
 * 頁尾最後一行的經營者署名：連到口袋工具的關於頁，同分頁開。繁中與英文兩份頁尾都有，英文頁也是同一句繁體原句、不翻譯，
 * 連結標 lang 與 hreflang="zh-Hant"（螢幕閱讀器換中文念，連過去的關於頁也是繁中）。
 * 字與網址只從 site.ts 的 publisher 取，不進語系字典。產物層級（每頁剛好一條、在最後一個 <footer> 的最後）由 scripts/seo/audit.mjs 驗。
 */
import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, provide, readonly, ref } from 'vue'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import DefaultLayout from './layouts/DefaultLayout.vue'
import { LOCALE_KEY, type Locale } from './i18n/locale'
import { publisher } from './config/site'

// 刻意再寫一次、不從 site.ts 推導：site.ts 改錯一個字（或把半形空格換成全形）才會被抓到
const OWNER_TEXT = '六角學院 卡斯伯 經營'
const OWNER_HREF = 'https://www.pocketool.app/about'

const RouterLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const wrappers: VueWrapper[] = []
/** 照 en-pages.test.ts 的 mountEn：外面包一層 provide 語系（App.vue 依路由的 meta.locale 給） */
function mountWith(locale: Locale) {
  const Wrap = defineComponent({
    setup() {
      provide(LOCALE_KEY, readonly(ref(locale)))
      return () => h(DefaultLayout)
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

describe('署名的字與網址', () => {
  it('字是兩個半形空格隔開的原句，網址是口袋工具的關於頁（不帶尾斜線、query 與 hash）', () => {
    expect(publisher.ownerLine).toBe(OWNER_TEXT)
    expect(publisher.ownerLine.split('').filter((c) => c === ' ')).toHaveLength(2)
    expect(publisher.aboutUrl).toBe(OWNER_HREF)
  })

  it('不在任何語系字典檔裡', () => {
    // happy-dom 環境的 import.meta.url 是 http://localhost，路徑照 hydration.test.ts 用 import.meta.dirname
    const dir = join(import.meta.dirname, 'locales')
    const dictionaries = readdirSync(dir).filter((f) => f.endsWith('.ts'))
    expect(dictionaries.length).toBeGreaterThan(0)
    for (const f of dictionaries) expect(readFileSync(join(dir, f), 'utf8'), f).not.toContain('六角學院')
  })
})

describe.each([
  ['繁中', 'zh-TW' as const],
  ['英文', 'en' as const],
])('%s頁尾的最後一行是經營者署名', (_label, locale) => {
  it('剛好一個，字、網址、lang 與 hreflang 都對，同分頁開', () => {
    const w = mountWith(locale)
    const hits = w.findAll('[data-owner-line]')
    expect(hits).toHaveLength(1)
    const a = hits[0]
    expect(a.element.tagName).toBe('A')
    expect(a.text()).toBe(OWNER_TEXT)
    expect(a.attributes('href')).toBe(OWNER_HREF)
    expect(a.attributes('lang')).toBe('zh-Hant')
    expect(a.attributes('hreflang')).toBe('zh-Hant')
    expect(a.attributes('target')).toBeUndefined()
    expect(a.attributes('rel')).toBeUndefined()
  })

  it('在頁尾裡、排在商標聲明後面，頁尾的字以它結尾', () => {
    const w = mountWith(locale)
    const footers = w.findAll('footer')
    expect(footers).toHaveLength(1)
    const footer = footers[0]
    const a = footer.get('[data-owner-line]')
    const trademark = footer.get('[data-test="trademark"]')
    expect(footer.text().trim().endsWith(OWNER_TEXT)).toBe(true)
    // 商標聲明在署名前面（DOCUMENT_POSITION_FOLLOWING：署名在商標之後）
    expect(trademark.element.compareDocumentPosition(a.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // 署名自己一個 <p>，而且是頁尾底部那一區的最後一個元素
    const p = a.element.parentElement!
    expect(p.tagName).toBe('P')
    expect(p.children).toHaveLength(1)
    expect(p.parentElement!.lastElementChild).toBe(p)
    expect(p.parentElement!.parentElement).toBe(footer.element)
    expect(footer.element.lastElementChild).toBe(p.parentElement)
  })

  it('字是 16px（text-base），字重與顏色照頁尾的強調連結，底線常駐', () => {
    const w = mountWith(locale)
    const a = w.get('[data-owner-line]')
    const pClass = a.element.parentElement!.className.split(/\s+/)
    expect(pClass).toContain('text-base')
    const aClass = (a.attributes('class') ?? '').split(/\s+/)
    expect(aClass).toEqual(expect.arrayContaining(['font-700', 'text-ink', 'underline', 'hover:text-link']))
  })
})
