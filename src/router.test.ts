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

describe('barcode 路由', () => {
  it('包含 /barcode 靜態路由（可被 vite-ssg 預渲染）', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/barcode')
  })
  it('/barcode 不含動態參數，includedRoutes 才會收它', () => {
    const r = routes.find(r => r.path === '/barcode')
    expect(r).toBeDefined()
    expect(r!.path).not.toContain(':')
  })
  it('/barcode 不加子路徑前綴（前綴由 router base 提供）', () => {
    expect(routes.some(r => r.path === '/qrcode-studio/barcode')).toBe(false)
  })
})
