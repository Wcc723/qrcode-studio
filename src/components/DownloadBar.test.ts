import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DownloadBar from './DownloadBar.vue'
import { COPY_MESSAGES } from '@/composables/useQrCode'

describe('DownloadBar', () => {
  it('點 PNG 時呼叫 download(\'png\')', async () => {
    const download = vi.fn()
    const wrapper = mount(DownloadBar, { props: { download, disabled: false } })
    await wrapper.find('[data-test="dl-png"]').trigger('click')
    expect(download).toHaveBeenCalledWith('png')
  })
  it('disabled 時按鈕停用', () => {
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: true } })
    expect(wrapper.find('[data-test="dl-png"]').attributes('disabled')).toBeDefined()
  })
  it('點 SVG 時呼叫 download(\'svg\')', async () => {
    const download = vi.fn()
    const wrapper = mount(DownloadBar, { props: { download, disabled: false } })
    await wrapper.find('[data-test="dl-svg"]').trigger('click')
    expect(download).toHaveBeenCalledWith('svg')
  })
  it('點 JPG 時呼叫 download(\'jpeg\')（副檔名對映）', async () => {
    const download = vi.fn()
    const wrapper = mount(DownloadBar, { props: { download, disabled: false } })
    await wrapper.find('[data-test="dl-jpg"]').trigger('click')
    expect(download).toHaveBeenCalledWith('jpeg')
  })
  it('disabled 時三個按鈕均停用', () => {
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: true } })
    expect(wrapper.find('[data-test="dl-png"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="dl-svg"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="dl-jpg"]').attributes('disabled')).toBeDefined()
  })

  it('dl-copy 按鈕存在', () => {
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: false } })
    expect(wrapper.find('[data-test="dl-copy"]').exists()).toBe(true)
  })

  it('點 dl-copy 時呼叫 copy()', async () => {
    const copy = vi.fn()
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: false, copy } })
    await wrapper.find('[data-test="dl-copy"]').trigger('click')
    expect(copy).toHaveBeenCalledOnce()
  })

  it('dl-copy disabled 時停用', () => {
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: true } })
    expect(wrapper.find('[data-test="dl-copy"]').attributes('disabled')).toBeDefined()
  })

  it('不傳 copy prop 時 dl-copy 按鈕仍正常顯示（不拋出例外）', () => {
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: false } })
    expect(wrapper.find('[data-test="dl-copy"]').exists()).toBe(true)
  })

  it('手機上四顆按鈕至少 44px 高（max-md:min-h-11），桌機不變', () => {
    const wrapper = mount(DownloadBar, { props: { download: vi.fn(), disabled: false } })
    for (const t of ['dl-png', 'dl-svg', 'dl-jpg', 'dl-copy']) {
      const classes = wrapper.find(`[data-test="${t}"]`).classes()
      expect(classes).toContain('max-md:min-h-11')
      expect(classes).not.toContain('min-h-11')
    }
  })

  it('複製的狀態列一直在 DOM 裡（role="status"，空的不佔高度），結果一出來就報讀', async () => {
    const w = mount(DownloadBar, { props: { download: vi.fn(), disabled: false } })
    const status = () => w.find('[data-test="copy-status"]')
    expect(status().attributes('role')).toBe('status')
    expect(status().text()).toBe('')
    await w.setProps({ copyStatus: 'copied' })
    expect(status().text()).toBe(COPY_MESSAGES.copied)
    expect(w.find('[data-test="dl-copy"]').text()).toBe('已複製')
    expect(w.find('[data-test="dl-copy"] .i-lucide-check').exists()).toBe(true)
    await w.setProps({ copyStatus: 'failed' })
    expect(status().text()).toBe(COPY_MESSAGES.failed)
    expect(w.find('[data-test="dl-copy"]').text()).toBe('複製')
    await w.setProps({ copyStatus: 'idle' })
    expect(status().text()).toBe('')
  })
})
