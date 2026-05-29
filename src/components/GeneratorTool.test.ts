import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import GeneratorTool from './GeneratorTool.vue'

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
