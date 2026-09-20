import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import GeneratorTool from './GeneratorTool.vue'
import QrPreview from './QrPreview.vue'
import { putScanHandoff, takeScanHandoff, clearScanHandoff } from '@/utils/scan-handoff'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
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
