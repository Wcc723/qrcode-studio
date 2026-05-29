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
})
