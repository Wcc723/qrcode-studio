import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import PreviewDock from './PreviewDock.vue'
import { defaultStyle } from '@/types'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
}))

function props(over: Record<string, unknown> = {}) {
  return { visible: true, live: false, data: 'https://example.com', qrStyle: { ...defaultStyle }, disabled: false, download: vi.fn(), copy: vi.fn(), ...over }
}

afterEach(() => {
  document.documentElement.classList.remove('has-preview-dock')
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('PreviewDock（手機底部預覽列）', () => {
  it('visible 為 false 時不顯示（預渲染與 hydrate 時就是這樣）', () => {
    const w = mount(PreviewDock, { props: props({ visible: false }) })
    expect((w.find('[data-test="preview-dock"]').element as HTMLElement).style.display).toBe('none')
  })

  it('外層是 .preview-dock：main.css 在 md 以上一律藏起來，桌機版面不變', () => {
    const w = mount(PreviewDock, { props: props() })
    expect(w.find('[data-test="preview-dock"]').classes()).toContain('preview-dock')
  })

  it('三顆按鈕的觸控高度至少 44px（min-h-11）', () => {
    const w = mount(PreviewDock, { props: props() })
    for (const t of ['dock-expand', 'dock-png', 'dock-copy']) expect(w.find(`[data-test="${t}"]`).classes()).toContain('min-h-11')
  })

  it('下載 PNG 與複製呼叫的是傳進來的同一組函式（下載的就是預覽框那一份）', async () => {
    const p = props()
    const w = mount(PreviewDock, { props: p })
    await w.find('[data-test="dock-png"]').trigger('click')
    await w.find('[data-test="dock-copy"]').trigger('click')
    expect(p.download).toHaveBeenCalledWith('png')
    expect(p.copy).toHaveBeenCalledOnce()
  })

  it('disabled 時下載與複製停用；「看大圖」仍可按', () => {
    const w = mount(PreviewDock, { props: props({ disabled: true }) })
    expect(w.find('[data-test="dock-png"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="dock-copy"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="dock-expand"]').attributes('disabled')).toBeUndefined()
  })

  it('點縮圖送出 expand', async () => {
    const w = mount(PreviewDock, { props: props() })
    await w.find('[data-test="dock-expand"]').trigger('click')
    expect(w.emitted('expand')).toHaveLength(1)
  })

  it('按鈕名稱讀得出來；縮圖本身對螢幕報讀器隱藏', () => {
    const w = mount(PreviewDock, { props: props({ live: true }) })
    const expand = w.find('[data-test="dock-expand"]')
    expect(expand.text()).toContain('看大圖')
    expect(expand.text()).toContain('其他下載格式')
    expect(expand.find('.dock-thumb').attributes('aria-hidden')).toBe('true')
    expect(w.find('[data-test="dock-png"]').text()).toContain('下載')
  })

  it('live 為 false（桌機）時不建縮圖；手機才畫', () => {
    expect(mount(PreviewDock, { props: props({ live: false }) }).find('[data-test="dock-qr"]').exists()).toBe(false)
    expect(mount(PreviewDock, { props: props({ live: true }) }).find('[data-test="dock-qr"]').exists()).toBe(true)
  })

  it('出現時 html 帶 has-preview-dock（留 scroll-padding），收起與卸載時拿掉', async () => {
    const w = mount(PreviewDock, { props: props({ visible: false }) })
    const cls = document.documentElement.classList
    await w.setProps({ visible: true })
    expect(cls.contains('has-preview-dock')).toBe(true)
    await w.setProps({ visible: false })
    expect(cls.contains('has-preview-dock')).toBe(false)
    await w.setProps({ visible: true })
    w.unmount()
    expect(cls.contains('has-preview-dock')).toBe(false)
  })

  it('出現的當下，正在打字的欄位被它蓋住就把頁面往上推；選單或勾選框不動', async () => {
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(664)
    const field = document.createElement('input')
    field.type = 'url'
    document.body.append(field)
    vi.spyOn(field, 'getBoundingClientRect').mockReturnValue({ bottom: 640 } as DOMRect)
    field.focus()
    const w = mount(PreviewDock, { props: props({ visible: false }), attachTo: document.body })
    vi.spyOn(w.find('[data-test="preview-dock"]').element as HTMLElement, 'offsetHeight', 'get').mockReturnValue(84)
    await w.setProps({ visible: true })
    await nextTick()
    await flushPromises()
    // 預覽列上緣在 664 - 84 = 580，欄位底在 640：往上推 60 再多留一點
    expect(scrollBy).toHaveBeenCalledOnce()
    expect((scrollBy.mock.calls[0][0] as ScrollToOptions).top).toBeGreaterThanOrEqual(60)

    scrollBy.mockClear()
    const box = document.createElement('input')
    box.type = 'checkbox'
    document.body.append(box)
    vi.spyOn(box, 'getBoundingClientRect').mockReturnValue({ bottom: 640 } as DOMRect)
    box.focus()
    await w.setProps({ visible: false })
    await w.setProps({ visible: true })
    await flushPromises()
    expect(scrollBy).not.toHaveBeenCalled()
  })
})
