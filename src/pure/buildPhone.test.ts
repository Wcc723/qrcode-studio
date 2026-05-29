import { describe, it, expect } from 'vitest'
import { buildPhone } from './buildPhone'

describe('buildPhone', () => {
  it('產生 tel:', () => {
    expect(buildPhone({ number: '0912345678' })).toBe('tel:0912345678')
  })
  it('移除號碼中的空白與連字號', () => {
    expect(buildPhone({ number: '09 1234-5678' })).toBe('tel:0912345678')
  })
  it('空字串回傳空字串', () => {
    expect(buildPhone({ number: '' })).toBe('')
  })
})
