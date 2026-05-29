import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdSlot from './AdSlot.vue'

describe('AdSlot', () => {
  it('未啟用時顯示佔位、不渲染廣告腳本', () => {
    const wrapper = mount(AdSlot, { props: { slotId: 'demo' } })
    expect(wrapper.find('[data-test="ad-placeholder"]').exists()).toBe(true)
  })
})
