import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import QrPreview from './QrPreview.vue'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
}))

describe('QrPreview', () => {
  it('顯示信任徽章與預覽容器', () => {
    const wrapper = mount(QrPreview, { props: { data: 'https://x.com' } })
    expect(wrapper.text()).toContain('不上傳')
    expect(wrapper.find('[data-test="qr-container"]').exists()).toBe(true)
  })
  it('data 為空時顯示提示', () => {
    const wrapper = mount(QrPreview, { props: { data: '' } })
    expect(wrapper.text()).toContain('輸入內容')
  })
})
