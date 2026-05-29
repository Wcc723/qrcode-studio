import { describe, it, expect, vi } from 'vitest'
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
})
