import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UrlInput from './UrlInput.vue'

describe('UrlInput', () => {
  it('輸入網址時 emit 組好的 payload', async () => {
    const wrapper = mount(UrlInput)
    await wrapper.find('input').setValue('example.com')
    const events = wrapper.emitted('update:payload')
    expect(events?.at(-1)?.[0]).toBe('https://example.com')
  })
})
