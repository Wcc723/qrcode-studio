import { describe, it, expect } from 'vitest'
import { buildText } from './buildText'

describe('buildText', () => {
  it('原樣回傳文字', () => {
    expect(buildText({ text: 'Hello 世界\n第二行' })).toBe('Hello 世界\n第二行')
  })
  it('空字串回傳空字串', () => {
    expect(buildText({ text: '' })).toBe('')
  })
})
