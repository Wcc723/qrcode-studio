import { describe, it, expect } from 'vitest'
import { buildEmail } from './buildEmail'

describe('buildEmail', () => {
  it('產生含主旨與內文的 mailto', () => {
    expect(buildEmail({ to: 'a@b.com', subject: 'Hi there', body: 'line1 line2' }))
      .toBe('mailto:a@b.com?subject=Hi%20there&body=line1%20line2')
  })
  it('只有收件者', () => {
    expect(buildEmail({ to: 'a@b.com', subject: '', body: '' })).toBe('mailto:a@b.com')
  })
  it('收件者為空回傳空字串', () => {
    expect(buildEmail({ to: '', subject: 'x', body: '' })).toBe('')
  })
})
