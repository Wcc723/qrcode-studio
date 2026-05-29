import { describe, it, expect } from 'vitest'
import { buildPayload } from './index'

describe('buildPayload 分派', () => {
  it('url', () => { expect(buildPayload('url', { url: 'example.com' })).toBe('https://example.com') })
  it('wifi', () => {
    expect(buildPayload('wifi', { ssid: 'N', password: 'p', encryption: 'WPA', hidden: false }))
      .toBe('WIFI:T:WPA;S:N;P:p;H:false;;')
  })
  it('phone', () => { expect(buildPayload('phone', { number: '0912345678' })).toBe('tel:0912345678') })
})
