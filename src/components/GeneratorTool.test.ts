import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import GeneratorTool from './GeneratorTool.vue'
import QrPreview from './QrPreview.vue'
import { putScanHandoff, takeScanHandoff, clearScanHandoff } from '@/utils/scan-handoff'

// 記下每個 QR Code 物件的畫法、重畫次數與下載呼叫：預覽框（canvas）與手機預覽列的縮圖（svg）各一份
type Made = { type: string; download: (...a: unknown[]) => unknown; updates: number }
const qr = vi.hoisted(() => ({ made: [] as Made[] }))
vi.mock('qr-code-styling', () => ({
  default: class {
    download = vi.fn()
    rec: Made
    constructor(o: { type: string }) { this.rec = { type: o.type, download: this.download, updates: 0 }; qr.made.push(this.rec) }
    append() {}
    update() { this.rec.updates++ }
    async getRawData() { return new Blob(['png'], { type: 'image/png' }) }
  },
}))

describe('GeneratorTool', () => {
  it('依 defaultType 預選類型並顯示對應輸入', () => {
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'wifi' } })
    expect(wrapper.find('[data-test="ssid"]').exists()).toBe(true)
  })
  it('預設 url 類型', () => {
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'url' } })
    expect(wrapper.find('input[type="url"]').exists()).toBe(true)
  })
  it('超過容量時下載按鈕應停用', async () => {
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'text' } })
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    // Type a string exceeding the max L-level capacity (2953 bytes)
    await textarea.setValue('a'.repeat(2954))
    await nextTick()
    expect(wrapper.find('[data-test="dl-png"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="dl-svg"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="dl-jpg"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="dl-copy"]').attributes('disabled')).toBeDefined()
  })
})

describe('從 /scan/ 交棒過來的內容', () => {
  beforeEach(() => clearScanHandoff())

  it('切到對應類型，並把欄位填回去', async () => {
    putScanHandoff({
      kind: 'qr', type: 'wifi',
      data: { ssid: 'Cafe', password: 'pw', encryption: 'WPA', hidden: false },
    })
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await nextTick()
    await nextTick()
    expect((wrapper.find('[data-test="ssid"]').element as HTMLInputElement).value).toBe('Cafe')
    expect((wrapper.find('[data-test="password"]').element as HTMLInputElement).value).toBe('pw')
  })

  it('還原出來的 payload 與掃到的字串一模一樣', async () => {
    putScanHandoff({
      kind: 'qr', type: 'wifi',
      data: { ssid: 'Cafe', password: 'pw', encryption: 'WPA', hidden: false },
    })
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await nextTick()
    await nextTick()
    expect(wrapper.findComponent(QrPreview).props('data')).toBe('WIFI:T:WPA;S:Cafe;P:pw;H:false;;')
  })

  it('同型別（例如在 /url/ 收到網址交棒）也要填得進去', async () => {
    putScanHandoff({ kind: 'qr', type: 'url', data: { url: 'https://example.com/a' } })
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await nextTick()
    await nextTick()
    expect((wrapper.find('input[type="url"]').element as HTMLInputElement).value).toBe('https://example.com/a')
  })

  it('只吃一次：第二個產生器不會再拿到同一筆', async () => {
    putScanHandoff({ kind: 'qr', type: 'url', data: { url: 'https://example.com/a' } })
    mount(GeneratorTool, { props: { defaultType: 'url' } })
    await nextTick()
    const second = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await nextTick()
    await nextTick()
    expect((second.find('input[type="url"]').element as HTMLInputElement).value).toBe('')
  })

  it('沒有交棒時維持原本的空白行為', async () => {
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await nextTick()
    expect((wrapper.find('input[type="url"]').element as HTMLInputElement).value).toBe('')
  })

  it('交棒內容不會落到網址或瀏覽器儲存空間', async () => {
    putScanHandoff({
      kind: 'qr', type: 'wifi',
      data: { ssid: 'Cafe', password: 'secret', encryption: 'WPA', hidden: false },
    })
    mount(GeneratorTool, { props: { defaultType: 'wifi' } })
    await nextTick()
    await nextTick()
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('一維碼的交棒不歸它管，會被丟掉而不是硬塞', async () => {
    putScanHandoff({ kind: 'barcode', symbology: 'ean13', value: '4710088331236' })
    const wrapper = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await nextTick()
    await nextTick()
    expect((wrapper.find('input[type="url"]').element as HTMLInputElement).value).toBe('')
    expect(takeScanHandoff()).toBeNull()
  })
})

describe('手機底部預覽列（#11）', () => {
  /**
   * 手機寬度、預覽區在視窗下方。IntersectionObserver 由測試決定什麼時候通知。
   * 螢幕寬度先是桌機、掛上之後才轉成手機（narrow() 發 change）：預覽框與縮圖同時動態 import
   * 被 vi.mock 的套件時，vitest 會把後到的那個解析成真的套件，所以讓縮圖晚一步才建。
   */
  function phone() {
    const listeners = new Set<() => void>()
    const mq = { matches: false, addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) }
    vi.stubGlobal('matchMedia', vi.fn((q: string) => (q.includes('prefers-reduced-motion') ? { ...mq, matches: false } : mq)))
    let cb: IntersectionObserverCallback | null = null
    vi.stubGlobal('IntersectionObserver', class {
      constructor(f: IntersectionObserverCallback) { cb = f }
      observe() {}
      disconnect() {}
    })
    return {
      below: (v: boolean) => cb?.([{ isIntersecting: !v } as IntersectionObserverEntry], {} as IntersectionObserver),
      narrow: async () => { await flushPromises(); mq.matches = true; for (const f of listeners) f(); await flushPromises() },
    }
  }
  const dockShown = (w: ReturnType<typeof mount>) => (w.find('[data-test="preview-dock"]').element as HTMLElement).style.display !== 'none'

  beforeEach(() => { qr.made.length = 0 })
  afterEach(() => { vi.unstubAllGlobals(); document.documentElement.classList.remove('has-preview-dock') })

  it('結構：預覽區可以接焦點、零高度的「預覽區的底」排在下載鈕後面、預覽列在工具卡裡（不用 Teleport）', () => {
    const w = mount(GeneratorTool, { props: { defaultType: 'url' } })
    const zone = w.find('[data-test="preview-zone"]')
    expect(zone.attributes('tabindex')).toBe('-1')
    expect(zone.element.lastElementChild?.getAttribute('data-test')).toBe('preview-end')
    expect(zone.find('[data-test="dl-png"]').exists()).toBe(true)
    expect(w.find('.card [data-test="preview-dock"]').exists()).toBe(true)
  })

  it('桌機寬度（預設的 happy-dom 1024px）：輸入後也不出現，也不多建一份 QR Code', async () => {
    const w = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await w.find('input[type="url"]').setValue('https://example.com')
    await flushPromises()
    expect(dockShown(w)).toBe(false)
    expect(qr.made.map((m) => m.type)).toEqual(['canvas'])
  })

  it('手機：輸入前不出現；輸入後、預覽區還在下方時出現；捲到預覽區就收起來', async () => {
    const io = phone()
    const w = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await io.narrow()
    io.below(true)
    await nextTick()
    expect(dockShown(w)).toBe(false)
    await w.find('input[type="url"]').setValue('https://example.com')
    await flushPromises()
    expect(dockShown(w)).toBe(true)
    io.below(false)
    await nextTick()
    expect(dockShown(w)).toBe(false)
  })

  it('預覽列的「下載 PNG」走預覽框（canvas）那一份，不是縮圖', async () => {
    const io = phone()
    const w = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await io.narrow()
    io.below(true)
    await w.find('input[type="url"]').setValue('https://example.com')
    await flushPromises()
    expect(qr.made.map((m) => m.type).sort()).toEqual(['canvas', 'svg'])
    await w.find('[data-test="dock-png"]').trigger('click')
    await flushPromises()
    const canvas = qr.made.find((m) => m.type === 'canvas')!
    const svg = qr.made.find((m) => m.type === 'svg')!
    expect(canvas.download).toHaveBeenCalledWith({ name: 'qrcode', extension: 'png' })
    expect(svg.download).not.toHaveBeenCalled()
  })

  it('超過容量時預覽列的下載與複製也停用', async () => {
    const io = phone()
    const w = mount(GeneratorTool, { props: { defaultType: 'text' } })
    await io.narrow()
    io.below(true)
    await w.find('textarea').setValue('a'.repeat(2954))
    await flushPromises()
    expect(w.find('[data-test="dock-png"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="dock-copy"]').attributes('disabled')).toBeDefined()
  })

  it('點縮圖：焦點移到預覽區，再捲過去', async () => {
    const io = phone()
    const w = mount(GeneratorTool, { props: { defaultType: 'url' }, attachTo: document.body })
    await io.narrow()
    io.below(true)
    await w.find('input[type="url"]').setValue('https://example.com')
    await flushPromises()
    const zone = w.find('[data-test="preview-zone"]').element as HTMLElement
    const scroll = vi.fn()
    zone.scrollIntoView = scroll
    await w.find('[data-test="dock-expand"]').trigger('click')
    expect(document.activeElement).toBe(zone)
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ block: 'start' }))
    w.unmount()
  })

  it('預覽列收著（打字中、鍵盤開著）時縮圖不跟著每個字重畫；出現時才畫', async () => {
    const io = phone()
    const w = mount(GeneratorTool, { props: { defaultType: 'text' } })
    await io.narrow()
    io.below(false) // 預覽列收著
    for (const v of ['h', 'he', 'hel', 'hell', 'hello']) {
      await w.find('textarea').setValue(v)
      await nextTick()
    }
    await flushPromises()
    expect(dockShown(w)).toBe(false)
    expect(qr.made.filter((m) => m.type === 'svg')).toHaveLength(0)
    const canvas = qr.made.find((m) => m.type === 'canvas')!
    expect(canvas.updates).toBeGreaterThanOrEqual(5) // 預覽框照常跟著每個字畫

    io.below(true)
    await flushPromises()
    expect(dockShown(w)).toBe(true)
    const svg = qr.made.filter((m) => m.type === 'svg')
    expect(svg).toHaveLength(1)
    expect(svg[0].updates).toBe(0) // 建一次就畫好，沒有多畫
    await w.find('textarea').setValue('hello!')
    await nextTick()
    expect(svg[0].updates).toBe(1) // 出現之後照常跟著內容變
  })

  it('輸入的內容不會落到網址或瀏覽器儲存空間', async () => {
    const io = phone()
    const w = mount(GeneratorTool, { props: { defaultType: 'url' } })
    await io.narrow()
    io.below(true)
    await w.find('input[type="url"]').setValue('https://example.com/secret')
    await flushPromises()
    expect(dockShown(w)).toBe(true)
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
