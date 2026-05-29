import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StylePanel from './StylePanel.vue'
import { defaultStyle } from '@/types'

describe('StylePanel', () => {
  it('改變前景色時 emit 更新後的 style', async () => {
    const wrapper = mount(StylePanel, { props: { modelValue: { ...defaultStyle } } })
    await wrapper.find('[data-test="dotColor"]').setValue('#ff0000')
    const events = wrapper.emitted('update:modelValue')
    expect((events?.at(-1)?.[0] as any).dotColor).toBe('#ff0000')
  })
  it('切換透明背景', async () => {
    const wrapper = mount(StylePanel, { props: { modelValue: { ...defaultStyle } } })
    await wrapper.find('[data-test="transparent"]').setValue(true)
    const events = wrapper.emitted('update:modelValue')
    expect((events?.at(-1)?.[0] as any).bgColor).toBe('transparent')
  })
})
