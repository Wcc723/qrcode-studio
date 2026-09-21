import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdSlot from './AdSlot.vue'

describe('AdSlot', () => {
  it('未啟用時什麼都不渲染：沒有佔位框、沒有「廣告版位」字樣、沒有廣告腳本', () => {
    const wrapper = mount(AdSlot, { props: { slotId: 'demo' } })
    expect(wrapper.find('[data-test="ad-placeholder"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="ad-slot"]').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
    expect(wrapper.html()).not.toContain('廣告')
    expect(wrapper.html()).not.toContain('adsbygoogle')
  })
})
