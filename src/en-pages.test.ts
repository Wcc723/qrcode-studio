/**
 * 英文版的元件：同一批工具元件在英文頁拿到英文的文案、美國 Letter 的標籤紙與英寸。
 * 英文頁在 setup 裡 provide 語系與英文文案（App.vue 依路由的 meta.locale 給語系，英文頁再給 uiCopyEn），
 * 這裡用一層包裝元件做同樣的事。實際的列印版面（每頁 215.9 × 279.4 mm）由瀏覽器驗。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, provide, readonly, ref, type Component } from 'vue'
import GeneratorTool from './components/GeneratorTool.vue'
import BarcodeTool from './components/barcode/BarcodeTool.vue'
import BatchTool from './components/batch/BatchTool.vue'
import DefaultLayout from './layouts/DefaultLayout.vue'
import { LOCALE_KEY } from './i18n/locale'
import { provideUiCopy } from './locales/ui'
import { uiCopyEn } from './locales/ui.en'
import { publisher, site } from './config/site'
import { OFFSET_STORAGE_KEY } from './utils/batch-label-offset'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
}))

const RouterLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const wrappers: VueWrapper[] = []
function mountEn(component: Component, props: Record<string, unknown> = {}) {
  const Wrap = defineComponent({
    setup() {
      provide(LOCALE_KEY, readonly(ref('en' as const)))
      provideUiCopy(uiCopyEn)
      return () => h(component, props)
    },
  })
  const w = mount(Wrap, { global: { stubs: { RouterLink: RouterLinkStub } }, attachTo: document.body })
  wrappers.push(w)
  return w
}
const $ = (w: VueWrapper, t: string) => w.find(`[data-test="${t}"]`)
const $$ = (w: VueWrapper, t: string) => w.findAll(`[data-test="${t}"]`)
/** 畫面上的字與屬性有沒有中文（開發版的 Vue 會把模板裡的中文註解留在 DOM，不算） */
const hasHan = (s: string) => /\p{Script=Han}/u.test(s.replace(/<!--[\s\S]*?-->/g, ''))
const styleOf = (el: { attributes: (k: string) => string | undefined }) => el.attributes('style') ?? ''
const pageRuleInHead = () => document.head.querySelector('style[data-label-page]')?.textContent

beforeEach(() => {
  Object.defineProperty(window, 'print', { value: vi.fn(), configurable: true, writable: true })
  localStorage.clear()
})
afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
  document.body.innerHTML = ''
})

describe('英文首頁的產生器', () => {
  it('只有網址一種：沒有類型切換，欄位、外觀、預覽、下載與隱私那一行都是英文', () => {
    const w = mountEn(GeneratorTool, { defaultType: 'url', only: 'url' })
    expect(w.text()).toContain('Website URL')
    expect(w.text()).toContain('Made in your browser, nothing is uploaded')
    expect(w.text()).toContain('Error correction')
    expect(w.findAll('button.help-tip-btn').map(b => b.attributes('aria-label'))).toContain('More about logo')
    // 類型切換的按鈕（WiFi、電子名片…）不在英文頁上
    expect(w.text()).not.toContain('WiFi')
    expect(hasHan(w.html()), w.html().match(/[^<>]*\p{Script=Han}[^<>]*/u)?.[0]).toBe(false)
  })

  it('隱私說明連到 hub 的英文隱私權政策', () => {
    const w = mountEn(GeneratorTool, { defaultType: 'url', only: 'url' })
    expect(w.find('[data-test="privacy-note"] a').attributes('href')).toBe(publisher.privacyUrlEn)
  })
})

describe('英文的條碼產生器', () => {
  it('類型、欄位、規則與錯誤都是英文', async () => {
    const w = mountEn(BarcodeTool)
    await w.find('[data-test="bc-radio-ean13"]').setValue(true)
    await w.find('[data-test="bc-value"]').setValue('123')
    await flushPromises()
    expect($(w, 'bc-hint').text()).toContain('Type 12 digits and it is added for you')
    expect($(w, 'bc-error').text()).toBe('EAN-13 needs 12 digits (the check digit is added for you) or all 13 digits. This has 3.')
    expect(hasHan(w.html())).toBe(false)
  })

  it('補上檢查碼時用英文說明，列印資訊附英寸與 mil', async () => {
    const w = mountEn(BarcodeTool)
    await w.find('[data-test="bc-radio-ean13"]').setValue(true)
    await w.find('[data-test="bc-value"]').setValue('471008833123')
    await flushPromises()
    expect($(w, 'bc-notice').text()).toBe('Check digit 6 added. The full number is 4710088331236. Compare it with the number you were given.')
    expect($(w, 'bc-print-info').text()).toMatch(/Suggested print width [\d.]+ in \([\d.]+ mm\)/)
    expect($(w, 'bc-print-info').text()).toContain('Narrowest bar 0.33 mm (13 mil)')
  })
})

describe('英文的批次頁', () => {
  const LIST = 'Asset tag\tItem\tLocation\nA-1001\tLaptop\tFront office\nA-1002\tProjector\tRoom 204\nA-1003\tPrinter\tRoom 105\n'

  async function mountLabels(list?: string) {
    const w = mountEn(BatchTool)
    await w.find('[data-test="batch-output-label"]').setValue(true)
    await flushPromises()
    if (list !== undefined) {
      await $(w, 'batch-paste').setValue(list)
      await flushPromises()
    }
    return w
  }

  it('工具卡全是英文；範本的記號是 {id}', async () => {
    const w = mountEn(BatchTool)
    expect(w.text()).toContain('Paste from Excel or CSV')
    expect($(w, 'batch-insert-token').text()).toContain('{id}')
    await $(w, 'batch-template').setValue('https://x.example/asset/')
    await flushPromises()
    expect($(w, 'batch-template-error').text()).toContain('Add {id} to the template')
    expect(hasHan(w.html())).toBe(false)
  })

  it('貼上清單：欄名、檢查結果與下載鈕是英文', async () => {
    const w = mountEn(BatchTool)
    await $(w, 'batch-paste').setValue(LIST)
    await flushPromises()
    expect(($(w, 'batch-content-col').element as HTMLSelectElement).selectedOptions[0]!.text).toBe('Column A: Asset tag')
    expect($(w, 'batch-summary').text()).toBe('3 rows: 3 ready')
    expect($(w, 'batch-download').text()).toContain('Download ZIP (3 PNG files)')
    expect(hasHan(w.html())).toBe(false)
  })

  it('印標籤：預設跟 Avery 5160 同規格的 Letter，尺寸用英寸寫，每張紙 215.9 mm 寬、@page 是 letter', async () => {
    const w = await mountLabels()
    expect(($(w, 'label-sheet-select').element as HTMLSelectElement).value).toBe('avery-5160')
    expect($(w, 'label-sheet-info').text()).toBe('30 per sheet (3 columns × 10 rows), each 2.63 × 1 in. Margins: top 0.5, left 0.188, right 0.182, bottom 0.5 in; column gap 0.12 in.')
    expect(styleOf($(w, 'label-sheet'))).toContain('width: 215.9mm')
    expect(styleOf($(w, 'label-sheet'))).toContain('height: 278.9mm')
    expect($$(w, 'label-cell')).toHaveLength(30)
    expect(pageRuleInHead()).toBe('@page { size: letter; margin: 0; }')
    expect($(w, 'label-blocker').text()).toBe('Paste your list first.')
    expect($(w, 'label-print-tips').text()).toContain('set the paper size to Letter')
    expect(hasHan(w.html())).toBe(false)
  })

  it('格子照 Avery 範本的位置：第 1 格 0.188 in、0.5 in，第 5 格在第 2 列第 2 欄', async () => {
    const w = await mountLabels(LIST)
    const cells = $$(w, 'label-cell')
    expect(styleOf(cells[0]!)).toContain('left: 4.763mm')
    expect(styleOf(cells[0]!)).toContain('top: 12.7mm')
    expect(styleOf(cells[0]!)).toContain('width: 66.802mm')
    expect(cells[0]!.findAll('.label-line').map(l => l.text())).toEqual(['A-1001', 'Laptop', 'Front office'])
    expect($(w, 'label-print-btn').text()).toContain('Print labels (1 Letter sheet)')
    expect($(w, 'label-summary').text()).toBe('3 items on 1 Letter sheet.')
    await $(w, 'label-start').setValue('5')
    await flushPromises()
    expect($(w, 'label-start-hint').text()).toBe('Label 5 is row 2, column 2. The 4 before it stay blank (first sheet only).')
    expect(styleOf($$(w, 'label-cell')[4]!)).toContain('left: 74.613mm')
    expect(styleOf($$(w, 'label-cell')[4]!)).toContain('top: 38.1mm')
  })

  it('換成 A4 的 21 格：紙寬 210 mm、@page 換成 A4，按鈕寫 A4', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-sheet-select').setValue('a4-3x7')
    await flushPromises()
    expect(styleOf($(w, 'label-sheet'))).toContain('width: 210mm')
    expect(pageRuleInHead()).toBe('@page { size: A4; margin: 0; }')
    expect($(w, 'label-print-btn').text()).toContain('Print labels (1 A4 sheet)')
  })

  it('對位測試頁：2 英吋校正尺（刻度到 1/16 in），位移用英寸', async () => {
    const w = await mountLabels()
    await $(w, 'label-offset-x').setValue('0.1')
    await $(w, 'label-offset-x').trigger('change')
    await w.find('[data-test="label-target-test"]').setValue(true)
    await flushPromises()
    const ruler = $(w, 'label-ruler')
    expect(ruler.attributes('data-unit')).toBe('in')
    const base = $(w, 'label-ruler-base')
    expect(Number(base.attributes('x2')) - Number(base.attributes('x1'))).toBeCloseTo(50.8, 6)
    expect(ruler.findAll('line')).toHaveLength(1 + 2 * 16 + 1)
    expect($(w, 'label-test-info').text()).toContain('Avery 5160 size (30 labels)')
    expect($(w, 'label-test-info').text()).toContain('left/right +0.10 in')
    // 0.1 in = 2.54 mm：格線往右移
    expect($(w, 'label-test-sheet').find('[data-test="label-test-cell"]').attributes('x')).toBe('7.303')
    expect($(w, 'label-print-btn').text()).toContain('Print test page (1 Letter sheet)')
  })

  it('記住的位移存的是 mm，英文頁讀回來換成英寸', async () => {
    const w = await mountLabels()
    await $(w, 'label-offset-y').setValue('0.2')
    await $(w, 'label-remember').setValue(true)
    await flushPromises()
    const saved = JSON.parse(localStorage.getItem(OFFSET_STORAGE_KEY) ?? 'null')
    expect(saved).toEqual({ x: 0, y: 5.1 })
    const again = await mountLabels()
    expect(($(again, 'label-offset-y').element as HTMLInputElement).value).toBe('0.2')
  })

  it('自訂尺寸填英寸、可以選紙張，錯誤訊息是英文', async () => {
    const w = await mountLabels()
    await $(w, 'label-sheet-select').setValue('custom')
    await flushPromises()
    expect(($(w, 'label-custom-labelWidthMm').element as HTMLInputElement).value).toBe('2.63')
    expect(($(w, 'label-custom-paper').element as HTMLSelectElement).value).toBe('letter')
    await $(w, 'label-custom-labelWidthMm').setValue('3')
    await flushPromises()
    expect($(w, 'label-custom-error').text()).toContain('wider than a Letter sheet (8.5 in)')
    await $(w, 'label-custom-paper').setValue('a4')
    await $(w, 'label-custom-labelWidthMm').setValue('2')
    await flushPromises()
    expect($(w, 'label-custom-error').exists()).toBe(false)
    expect(pageRuleInHead()).toBe('@page { size: A4; margin: 0; }')
  })

  it('字型是 Arial、Verdana、Times New Roman', async () => {
    const w = await mountLabels()
    expect(($(w, 'label-font').element as HTMLSelectElement).value).toBe('arial')
    expect([...($(w, 'label-font').element as HTMLSelectElement).options].map(o => o.value)).toEqual(['arial', 'verdana', 'times'])
  })
})

describe('英文版的頁首與頁尾', () => {
  it('站名、導覽、語言切換、回報問題與商標聲明都是英文版的', () => {
    const w = mountEn(DefaultLayout, { switchTo: '/batch/' })
    expect($(w, 'site-name').text()).toBe(site.nameEn)
    const sw = $(w, 'lang-switch')
    expect(sw.attributes('href')).toBe('/batch/')
    expect(sw.attributes('hreflang')).toBe('zh-Hant-TW')
    expect(sw.text()).toBe('中文')
    expect($(w, 'report-link').attributes('href')).toBe(publisher.reportUrlEn)
    expect($(w, 'trademark').text()).toBe(site.trademarkEn)
    expect(w.findAll('nav a').map(a => a.attributes('href'))).toEqual(expect.arrayContaining(['/en/', '/en/batch/', '/en/barcode/']))
  })

  it('繁中版的頁首多一個 English：沒有對應頁時連到英文首頁', () => {
    const w = mount(DefaultLayout, { global: { stubs: { RouterLink: RouterLinkStub } } })
    wrappers.push(w)
    const sw = $(w, 'lang-switch')
    expect(sw.attributes('href')).toBe('/en/')
    expect(sw.attributes('hreflang')).toBe('en')
    expect(sw.attributes('lang')).toBe('en')
    expect(sw.text()).toBe('English')
    expect($(w, 'trademark').text()).toBe(site.trademark)
  })
})
