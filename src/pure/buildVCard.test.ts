import { describe, it, expect } from 'vitest'
import { buildVCard } from './buildVCard'

describe('buildVCard', () => {
  it('產生 vCard 3.0', () => {
    const out = buildVCard({
      firstName: '小明', lastName: '王', phone: '0912345678',
      email: 'a@b.com', org: 'ACME', title: 'PM',
      address: '台北市', website: 'https://acme.com',
    })
    expect(out).toContain('BEGIN:VCARD')
    expect(out).toContain('VERSION:3.0')
    expect(out).toContain('N:王;小明;;;')
    expect(out).toContain('FN:小明 王')
    expect(out).toContain('TEL:0912345678')
    expect(out).toContain('EMAIL:a@b.com')
    expect(out).toContain('ORG:ACME')
    expect(out).toContain('TITLE:PM')
    expect(out).toContain('URL:https://acme.com')
    expect(out).toContain('ADR:;;台北市;;;;')
    expect(out.trim().endsWith('END:VCARD')).toBe(true)
  })
  it('省略空欄位', () => {
    const out = buildVCard({ firstName: 'A', lastName: '', phone: '', email: '', org: '', title: '', address: '', website: '' })
    expect(out).toContain('FN:A')
    expect(out).not.toContain('TEL:')
    expect(out).not.toContain('ORG:')
  })
  it('完全空白回傳空字串', () => {
    expect(buildVCard({ firstName: '', lastName: '', phone: '', email: '', org: '', title: '', address: '', website: '' })).toBe('')
  })
})
