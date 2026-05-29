import { describe, it, expect } from 'vitest'
import { qrByteLength, exceedsQrCapacity } from './qrCapacity'

describe('qrByteLength', () => {
  it('ASCII 字串：位元組數等於字元數', () => {
    expect(qrByteLength('hi')).toBe(2)
  })

  it('多位元組字元：「中」佔 3 位元組', () => {
    expect(qrByteLength('中')).toBe(3)
  })

  it('1000 個「中」= 3000 位元組', () => {
    expect(qrByteLength('中'.repeat(1000))).toBe(3000)
  })
})

describe('exceedsQrCapacity', () => {
  it('短字串不超出任何等級', () => {
    expect(exceedsQrCapacity('hi', 'M')).toBe(false)
    expect(exceedsQrCapacity('hi', 'L')).toBe(false)
    expect(exceedsQrCapacity('hi', 'Q')).toBe(false)
    expect(exceedsQrCapacity('hi', 'H')).toBe(false)
  })

  it('3000 ASCII 字元超出所有等級', () => {
    const s = 'a'.repeat(3000)
    expect(exceedsQrCapacity(s, 'L')).toBe(true)
    expect(exceedsQrCapacity(s, 'M')).toBe(true)
    expect(exceedsQrCapacity(s, 'Q')).toBe(true)
    expect(exceedsQrCapacity(s, 'H')).toBe(true)
  })

  it('剛好在 L 等級上限（2953 位元組）不超出', () => {
    const s = 'a'.repeat(2953)
    expect(exceedsQrCapacity(s, 'L')).toBe(false)
  })

  it('超過 L 等級上限（2954 位元組）才超出', () => {
    const s = 'a'.repeat(2954)
    expect(exceedsQrCapacity(s, 'L')).toBe(true)
  })

  it('1000 個「中」（3000 位元組）超出 H 等級（1273）', () => {
    const s = '中'.repeat(1000)
    expect(exceedsQrCapacity(s, 'H')).toBe(true)
  })

  it('1000 個「中」（3000 位元組）也超出 L 等級（2953）', () => {
    const s = '中'.repeat(1000)
    expect(exceedsQrCapacity(s, 'L')).toBe(true)
  })

  it('剛好在 M 等級上限（2331 位元組）不超出', () => {
    const s = 'a'.repeat(2331)
    expect(exceedsQrCapacity(s, 'M')).toBe(false)
  })

  it('超過 M 等級上限（2332 位元組）超出', () => {
    const s = 'a'.repeat(2332)
    expect(exceedsQrCapacity(s, 'M')).toBe(true)
  })
})
