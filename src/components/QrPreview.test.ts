import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import QrPreview from './QrPreview.vue'

vi.mock('qr-code-styling', () => ({
  default: class {
    append() {}
    update() {}
    download() {}
    async getRawData() { return new Blob([], { type: 'image/png' }) }
  },
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

  it('v-show: qr-container 在 data 非空時可見，在 data 為空時隱藏', () => {
    const wrapperVisible = mount(QrPreview, { props: { data: 'https://x.com' } })
    const containerVisible = wrapperVisible.find('[data-test="qr-container"]')
    expect((containerVisible.element as HTMLElement).style.display).not.toBe('none')

    const wrapperHidden = mount(QrPreview, { props: { data: '' } })
    const containerHidden = wrapperHidden.find('[data-test="qr-container"]')
    expect((containerHidden.element as HTMLElement).style.display).toBe('none')
  })

  it('defineExpose: download 是可呼叫的函式', async () => {
    const wrapper = mount(QrPreview, { props: { data: 'https://x.com' } })
    expect(typeof (wrapper.vm as any).download).toBe('function')
    // 確認呼叫不拋出例外（qr-code-styling 已被 mock）
    await expect((wrapper.vm as any).download('png')).resolves.not.toThrow()
  })

  it('defineExpose: copyImage 是可呼叫的函式', () => {
    const wrapper = mount(QrPreview, { props: { data: 'https://x.com' } })
    expect(typeof (wrapper.vm as any).copyImage).toBe('function')
  })

  it('data 有內容但超出容量時顯示錯誤提示', async () => {
    // 超出所有 EC 等級的長字串
    const longData = 'a'.repeat(3000)
    const wrapper = mount(QrPreview, { props: { data: longData } })
    await flushPromises()
    expect(wrapper.find('[data-test="qr-capacity-error"]').exists()).toBe(true)
  })
})
