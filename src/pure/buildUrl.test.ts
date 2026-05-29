import { describe, it, expect } from 'vitest'
import { buildUrl } from './buildUrl'

describe('buildUrl', () => {
  it('保留已含協定的網址', () => {
    expect(buildUrl({ url: 'https://example.com' })).toBe('https://example.com')
  })
  it('沒有協定時自動補 https://', () => {
    expect(buildUrl({ url: 'example.com' })).toBe('https://example.com')
  })
  it('去除前後空白', () => {
    expect(buildUrl({ url: '  example.com  ' })).toBe('https://example.com')
  })
  it('空字串回傳空字串', () => {
    expect(buildUrl({ url: '' })).toBe('')
  })
})
