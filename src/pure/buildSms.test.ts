import { describe, it, expect } from 'vitest'
import { buildSms } from './buildSms'

describe('buildSms', () => {
  it('產生 SMSTO: 含訊息', () => {
    expect(buildSms({ number: '0912345678', message: 'hello' })).toBe('SMSTO:0912345678:hello')
  })
  it('只有號碼', () => {
    expect(buildSms({ number: '0912345678', message: '' })).toBe('SMSTO:0912345678:')
  })
  it('號碼為空回傳空字串', () => {
    expect(buildSms({ number: '', message: 'x' })).toBe('')
  })
})
