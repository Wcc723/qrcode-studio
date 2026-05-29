import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DownloadBar from './DownloadBar.vue'

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
})
