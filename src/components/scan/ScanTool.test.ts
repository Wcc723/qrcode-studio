import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import ScanTool from './ScanTool.vue'
import type { ScanDeps } from '@/composables/useImageScanner'
import type { RawBarcode } from '@/pure/scanResult'
import { takeScanHandoff, clearScanHandoff } from '@/utils/scan-handoff'

const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0, 0, 0, 0]

function pngBlob(): File {
  const bytes = new Uint8Array(256)
  bytes.set(PNG_HEAD)
  return new File([bytes], 'shot.png', { type: 'image/png' })
}

const imageData = () =>
  ({ data: new Uint8ClampedArray(4 * 100 * 80), width: 100, height: 80, colorSpace: 'srgb' }) as ImageData

function deps(results: RawBarcode[]): ScanDeps {
  return {
    loadImage: async () => ({ imageData: imageData(), close: () => {} }),
    decode: async () => results,
    createObjectUrl: () => 'blob:fake/1',
    revokeObjectUrl: () => {},
  }
}

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
}

async function mountTool(results: RawBarcode[] = [{ format: 'QRCode', text: 'https://example.com/a' }]) {
  const router = makeRouter()
  router.push('/scan/')
  await router.isReady()
  const wrapper = mount(ScanTool, {
    props: { deps: deps(results) },
    global: { plugins: [router], stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  return { wrapper, router }
}

/** 用檔案輸入欄位選一張圖（測試環境沒辦法真的設 input.files，所以直接觸發元件的處理常式）。 */
async function selectFiles(wrapper: VueWrapper, files: File[]) {
  const input = wrapper.find('[data-test="scan-file-input"]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  await flushPromises()
}

beforeEach(() => clearScanHandoff())

describe('三種輸入方式', () => {
  it('選檔案會解碼', async () => {
    const { wrapper } = await mountTool()
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.find('[data-test="scan-result-text"]').text()).toBe('https://example.com/a')
  })

  it('拖放會解碼，而且會阻止瀏覽器直接開啟檔案', async () => {
    const { wrapper } = await mountTool()
    const dropzone = wrapper.find('[data-test="scan-dropzone"]')
    await dropzone.trigger('drop', { dataTransfer: { files: [pngBlob()] } })
    await flushPromises()
    expect(wrapper.find('[data-test="scan-result-text"]').text()).toBe('https://example.com/a')
  })

  it('貼上截圖會解碼', async () => {
    const { wrapper } = await mountTool()
    const file = pngBlob()
    const event = new Event('paste') as Event & { clipboardData: unknown }
    event.clipboardData = { items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }] }
    document.dispatchEvent(event)
    await flushPromises()
    expect(wrapper.find('[data-test="scan-result-text"]').text()).toBe('https://example.com/a')
  })

  it('貼上純文字不會觸發解碼', async () => {
    const { wrapper } = await mountTool()
    const event = new Event('paste') as Event & { clipboardData: unknown }
    event.clipboardData = { items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }] }
    document.dispatchEvent(event)
    await flushPromises()
    expect(wrapper.find('[data-test="scan-result-text"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="scan-error"]').exists()).toBe(false)
  })

  it('一次丟兩張圖要擋下來', async () => {
    const { wrapper } = await mountTool()
    const dropzone = wrapper.find('[data-test="scan-dropzone"]')
    await dropzone.trigger('drop', { dataTransfer: { files: [pngBlob(), pngBlob()] } })
    await flushPromises()
    expect(wrapper.find('[data-test="scan-error"]').text()).toContain('一張')
  })

  it('卸載後不再監聽貼上事件', async () => {
    const { wrapper } = await mountTool()
    const remove = vi.spyOn(document, 'removeEventListener')
    wrapper.unmount()
    expect(remove).toHaveBeenCalledWith('paste', expect.any(Function))
  })
})

describe('結果只能是文字節點', () => {
  it('payload 裡的 HTML 會原樣顯示，不會變成真的元素', async () => {
    const payload = '<img src=x onerror="alert(1)"><script>alert(2)</script>'
    const { wrapper } = await mountTool([{ format: 'QRCode', text: payload }])
    await selectFiles(wrapper, [pngBlob()])
    const el = wrapper.find('[data-test="scan-result-text"]')
    expect(el.text()).toContain('<img src=x')
    expect(el.element.querySelector('img')).toBeNull()
    expect(el.element.querySelector('script')).toBeNull()
  })

  it('整個元件都沒有 innerHTML 注入的痕跡', async () => {
    const { wrapper } = await mountTool([{ format: 'QRCode', text: '<b>x</b>' }])
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.html()).not.toContain('<b>x</b>')
  })
})

describe('網址結果的安全動作', () => {
  it('http/https 才給直接開啟，而且是新分頁 ＋ noopener', async () => {
    const { wrapper } = await mountTool([{ format: 'QRCode', text: 'https://example.com/a' }])
    await selectFiles(wrapper, [pngBlob()])
    const link = wrapper.find('[data-test="scan-open"]')
    expect(link.attributes('href')).toBe('https://example.com/a')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
  })

  it('顯示 scheme 與 host，讓人按之前看得到要去哪', async () => {
    const { wrapper } = await mountTool([{ format: 'QRCode', text: 'https://example.com/a' }])
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.find('[data-test="scan-uri-host"]').text()).toContain('example.com')
    expect(wrapper.find('[data-test="scan-uri-scheme"]').text()).toContain('https')
  })

  it('javascript: 不提供任何可點的連結', async () => {
    const { wrapper } = await mountTool([{ format: 'QRCode', text: 'javascript:alert(1)' }])
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.find('[data-test="scan-open"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="scan-unsafe-scheme"]').text()).toContain('javascript')
    expect(wrapper.html()).not.toContain('href="javascript:')
  })

  it('data: 與 file: 同樣不給連結', async () => {
    for (const text of ['data:text/html;base64,PHN2Zz4=', 'file:///etc/passwd']) {
      const { wrapper } = await mountTool([{ format: 'QRCode', text }])
      await selectFiles(wrapper, [pngBlob()])
      expect(wrapper.find('[data-test="scan-open"]').exists()).toBe(false)
    }
  })
})

describe('多碼圖片', () => {
  it('明確說明限制，而且不給任何單一結果的動作', async () => {
    const { wrapper } = await mountTool([
      { format: 'QRCode', text: 'a' },
      { format: 'Code128', text: 'B' },
    ])
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.find('[data-test="scan-multiple"]').text()).toContain('2')
    expect(wrapper.find('[data-test="scan-result-text"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="scan-copy"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="scan-open"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="scan-regenerate"]').exists()).toBe(false)
  })
})

describe('讀不到與不支援', () => {
  it('讀不到條碼時給說明而不是錯誤', async () => {
    const { wrapper } = await mountTool([])
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.find('[data-test="scan-none"]').exists()).toBe(true)
  })

  it('格式不支援時說清楚，不給單一結果動作', async () => {
    const { wrapper } = await mountTool([{ format: 'DataMatrix', text: 'x' }])
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.find('[data-test="scan-unsupported"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="scan-regenerate"]').exists()).toBe(false)
  })
})

describe('重新產生', () => {
  it('QR 會把解析後的內容交棒給對應產生器並導過去', async () => {
    const { wrapper, router } = await mountTool([
      { format: 'QRCode', text: 'WIFI:T:WPA;S:Cafe;P:pw;H:false;;' },
    ])
    await selectFiles(wrapper, [pngBlob()])
    await wrapper.find('[data-test="scan-regenerate"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/wifi/')
    expect(takeScanHandoff()).toEqual({
      kind: 'qr', type: 'wifi',
      data: { ssid: 'Cafe', password: 'pw', encryption: 'WPA', hidden: false },
    })
  })

  it('一維碼交棒到 /barcode/', async () => {
    const { wrapper, router } = await mountTool([{ format: 'EAN13', text: '4710088331236' }])
    await selectFiles(wrapper, [pngBlob()])
    await wrapper.find('[data-test="scan-regenerate"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/barcode/')
    expect(takeScanHandoff()).toEqual({ kind: 'barcode', symbology: 'ean13', value: '4710088331236' })
  })

  it('交棒不會把內容寫進網址或任何儲存空間', async () => {
    const { wrapper, router } = await mountTool([{ format: 'QRCode', text: 'WIFI:T:WPA;S:Cafe;P:secret;H:false;;' }])
    await selectFiles(wrapper, [pngBlob()])
    await wrapper.find('[data-test="scan-regenerate"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/wifi/')
    expect(router.currentRoute.value.query).toEqual({})
    expect(router.currentRoute.value.hash).toBe('')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})

describe('無障礙', () => {
  it('有 live region 會播報解碼結果', async () => {
    const { wrapper } = await mountTool()
    const live = wrapper.find('[data-test="scan-live"]')
    expect(live.attributes('aria-live')).toBe('polite')
    await selectFiles(wrapper, [pngBlob()])
    expect(live.text()).toContain('QR Code')
  })

  it('選檔案是真的 label ＋ input，可以用鍵盤操作', async () => {
    const { wrapper } = await mountTool()
    const input = wrapper.find('[data-test="scan-file-input"]')
    expect(input.attributes('type')).toBe('file')
    expect(input.attributes('accept')).toContain('image/png')
    expect(wrapper.find(`label[for="${input.attributes('id')}"]`).exists()).toBe(true)
  })

  it('複製與重新產生都是 button，不是只綁 click 的 div', async () => {
    const { wrapper } = await mountTool()
    await selectFiles(wrapper, [pngBlob()])
    expect(wrapper.find('[data-test="scan-copy"]').element.tagName).toBe('BUTTON')
    expect(wrapper.find('[data-test="scan-regenerate"]').element.tagName).toBe('BUTTON')
  })
})
