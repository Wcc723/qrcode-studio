import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WifiInput from './WifiInput.vue'

describe('WifiInput', () => {
  it('填寫後 emit WIFI payload', async () => {
    const wrapper = mount(WifiInput)
    await wrapper.find('[data-test="ssid"]').setValue('MyNet')
    await wrapper.find('[data-test="password"]').setValue('pass123')
    const events = wrapper.emitted('update:payload')
    expect(events?.at(-1)?.[0]).toContain('WIFI:T:WPA;S:MyNet;P:pass123;')
  })
})
