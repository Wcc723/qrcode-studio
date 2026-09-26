/**
 * 收在「?」後面的說明（HelpTip）與必須留在畫面上的提示。
 *
 * 工具區只收「長、而且不看也能把欄位填完」的說明；錯誤、警告、填寫規則、隱私那一行一律看得到，
 * 收起來只會讓工具更難用。這組測試同時守兩個方向（規則寫在 AGENTS.md「工具區與說明文章」）：
 * - 收進「?」的：預設收起（hidden）、文字仍在 DOM 裡、欄位用 aria-describedby 指得到它、裡面沒有可填的欄位
 * - 必須看得到的：不在任何收起來的容器裡
 */
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import GeneratorTool from './components/GeneratorTool.vue'
import StylePanel from './components/StylePanel.vue'
import BarcodeTool from './components/barcode/BarcodeTool.vue'
import ScanTool from './components/scan/ScanTool.vue'
import ScanResultView from './components/scan/ScanResultView.vue'
import { qrTypes } from './config/qr-types'
import { symbologies } from './config/symbologies'
import { toScanOutcome } from './pure/scanResult'
import { defaultStyle, type QrType } from './types'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
}))
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}))

const opts = { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } }

/** 收起來的容器：欄名旁的「?」 */
const COLLAPSED = '.help-tip-panel'

/** 這段字在畫面上，而且不在任何收起來的容器裡 */
function expectVisible(wrapper: VueWrapper, text: string) {
  const holders = wrapper
    .findAll('p, li, span, div, label, legend')
    .filter((el) => el.text().includes(text) && ![...el.element.children].some((c) => (c.textContent ?? '').includes(text)))
  expect(holders.length, `找不到「${text}」`).toBeGreaterThan(0)
  for (const el of holders) expect(el.element.closest(COLLAPSED), `「${text}」被收起來了`).toBeNull()
}

/** 每個「?」預設收起、有內容、裡面沒有可填的欄位，而且有東西用 aria-describedby 指到它 */
function expectHelpContract(wrapper: VueWrapper) {
  const panels = wrapper.findAll(COLLAPSED)
  expect(panels.length).toBeGreaterThan(0)
  const described = wrapper.findAll('[aria-describedby]').flatMap((el) => el.attributes('aria-describedby')!.split(/\s+/))
  for (const panel of panels) {
    const id = panel.attributes('id')!
    expect(panel.attributes('hidden'), `#${id} 預設要收起來`).toBeDefined()
    expect(panel.text().length, `#${id} 是空的`).toBeGreaterThan(20)
    expect(panel.findAll('input, select, textarea, button'), `#${id} 裡不該有可填的欄位`).toHaveLength(0)
    // 隱私那一行本身就是一句完整的說明，「?」只是補充，不接到任何欄位
    if (panel.element.closest('[data-test="privacy-note"]')) continue
    expect(described, `沒有欄位用 aria-describedby 指到 #${id}`).toContain(id)
  }
}

describe('產生器的「?」', () => {
  it.each(qrTypes.map((t) => [t.type]))('%s：每個「?」預設收起、欄位指得到它', (type) => {
    expectHelpContract(mount(GeneratorTool, { props: { defaultType: type as QrType }, ...opts }))
  })

  it('每種類型的輸入欄都至少有一個「?」', () => {
    for (const t of qrTypes) {
      const w = mount(GeneratorTool, { props: { defaultType: t.type }, ...opts })
      // 外觀（顏色、LOGO、容錯、尺寸）有 4 個、隱私 1 個，輸入欄至少再 1 個
      expect(w.findAll(COLLAPSED).length, t.type).toBeGreaterThanOrEqual(6)
    }
  })

  it('隱私說明只有一行，而且看得到；預覽框不再重複', () => {
    const w = mount(GeneratorTool, { props: { defaultType: 'url' }, ...opts })
    expect(w.findAll('[data-test="privacy-note"]')).toHaveLength(1)
    expectVisible(w, '只在你的瀏覽器產生，內容不上傳')
    // 以前標題貼紙、預覽框各有一句「不傳雲端」，現在工具卡裡只剩頂部這一行
    expect(w.text()).not.toContain('不傳雲端')
    expect(w.text().match(/內容不上傳/g)).toHaveLength(1)
  })

  it('內容超過容量的錯誤看得到', async () => {
    const w = mount(GeneratorTool, { props: { defaultType: 'text' }, ...opts })
    await w.find('textarea').setValue('a'.repeat(3000))
    await flushPromises()
    const err = w.find('[data-test="qr-capacity-error"]')
    expect(err.exists()).toBe(true)
    expect(err.element.closest(COLLAPSED)).toBeNull()
    expect(w.find('[data-test="dl-png"]').attributes('disabled')).toBeDefined()
  })

  it('勾了透明，JPG 會改用白底的提醒看得到', async () => {
    const w = mount(StylePanel, { props: { modelValue: { ...defaultStyle, bgColor: 'transparent' } }, ...opts })
    expect(w.find('[data-test="transparent-jpg-note"]').exists()).toBe(true)
    expectVisible(w, 'JPG 不支援透明')
    const opaque = mount(StylePanel, { props: { modelValue: { ...defaultStyle } }, ...opts })
    expect(opaque.find('[data-test="transparent-jpg-note"]').exists()).toBe(false)
  })
})

describe('一維條碼的「?」', () => {
  it('每個「?」預設收起、欄位指得到它', () => {
    expectHelpContract(mount(BarcodeTool, opts))
  })

  it('五種條碼的用途收在「條碼類型」的「?」裡，填寫規則留在輸入框下方', async () => {
    const w = mount(BarcodeTool, opts)
    const typeHelp = w.find('#bc-sym-help')
    for (const s of symbologies) expect(typeHelp.text()).toContain(s.about)
    for (const s of symbologies) {
      await w.find(`[data-test="bc-radio-${s.id}"]`).setValue()
      expect(w.find('[data-test="bc-hint"]').text()).toBe(s.rule)
      expectVisible(w, s.rule)
    }
  })

  it('錯誤、檢查碼提示、列印尺寸與 PNG 像素數看得到', async () => {
    const w = mount(BarcodeTool, opts)
    await w.find('[data-test="bc-radio-ean13"]').setValue()
    await w.find('[data-test="bc-value"]').setValue('5449000000990')
    expectVisible(w, '檢查碼不符')
    await w.find('[data-test="bc-value"]').setValue('544900000099')
    expectVisible(w, '已自動補上檢查碼 6')
    // 數字本身留在畫面上；DPI 怎麼算、PNG 為什麼不準才收進「?」
    for (const sel of ['[data-test="bc-print-info"]', '[data-test="bc-png-info"]']) {
      expect(w.find(sel).exists(), sel).toBe(true)
      expect(w.find(sel).element.closest(COLLAPSED), sel).toBeNull()
    }
    expect(w.find('[data-test="bc-png-info"]').text()).toMatch(/PNG \d+ × \d+ px，約 \d+ DPI/)
  })
})

describe('掃描器的「?」', () => {
  it('每個「?」預設收起、欄位指得到它', () => {
    expectHelpContract(mount(ScanTool, opts))
  })

  it('怎麼丟圖與支援的格式看得到，上限與 SVG 的理由收在「?」裡', () => {
    const w = mount(ScanTool, opts)
    expectVisible(w, '把圖片拖進來')
    expectVisible(w, '支援 PNG、JPEG、WebP，一次一張')
    expectVisible(w, '在你的瀏覽器內解碼，圖片不上傳')
    const help = w.findAll(COLLAPSED).map((p) => p.text()).join('\n')
    expect(help).toContain('12 MB')
    expect(help).toContain('不支援 SVG')
  })

  it('非 http(s) 的警告、多個條碼與讀不到的指引看得到', () => {
    const unsafe = mount(ScanResultView, { props: { outcome: toScanOutcome([{ format: 'QRCode', text: 'javascript:alert(1)' }]) }, ...opts })
    expectVisible(unsafe, '不是一般網址')
    const multiple = mount(ScanResultView, { props: { outcome: { status: 'multiple', count: 2, formatLabels: [] } }, ...opts })
    expectVisible(multiple, '請把圖裁切成只剩一個條碼再試一次')
    const none = mount(ScanResultView, { props: { outcome: { status: 'none' } }, ...opts })
    expectVisible(none, '把條碼那一塊裁切出來')
  })
})
