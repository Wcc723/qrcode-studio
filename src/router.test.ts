import { describe, it, expect } from 'vitest'
import { routes } from './router'

describe('routes', () => {
  it('包含首頁與 7 個類型 landing', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/')
    for (const p of ['/url', '/wifi', '/vcard', '/text', '/email', '/phone', '/sms']) {
      expect(paths).toContain(p)
    }
  })
})
