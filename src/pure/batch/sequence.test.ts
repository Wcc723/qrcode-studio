import { describe, it, expect } from 'vitest'
import { buildSequence, sequencePreview, formatCount, type SequenceSpec } from './sequence'
import { checkRows, rowsFromSequence } from './rows'

const base: SequenceSpec = { prefix: '', start: '1', until: 'count', count: '3', end: '', step: '1', pad: '0', suffix: '' }
const values = (spec: Partial<SequenceSpec>, max = 2000) => {
  const r = buildSequence({ ...base, ...spec }, max)
  if (!r.ok) throw new Error(r.error)
  return r.values
}

describe('buildSequence：前綴、補零、增量、後綴', () => {
  it('補零與前後綴', () => {
    expect(values({ prefix: 'TP-', start: '1', count: '3', pad: '4', suffix: '-A' })).toEqual(['TP-0001-A', 'TP-0002-A', 'TP-0003-A'])
  })

  it('不補零時照原本的位數；數字超過補零位數不截斷', () => {
    expect(values({ start: '9', count: '3' })).toEqual(['9', '10', '11'])
    expect(values({ start: '998', count: '3', pad: '3' })).toEqual(['998', '999', '1000'])
  })

  it('增量', () => {
    expect(values({ start: '0', count: '4', step: '5', pad: '2' })).toEqual(['00', '05', '10', '15'])
  })

  it('用結束值：最後一筆不超過結束值', () => {
    expect(values({ until: 'end', start: '1', end: '10', step: '4' })).toEqual(['1', '5', '9'])
    expect(values({ until: 'end', start: '7', end: '7' })).toEqual(['7'])
  })

  it('全形數字與前後空白也收', () => {
    expect(values({ start: ' １０ ', count: '２' })).toEqual(['10', '11'])
  })

  it('增量留白當成 1，補零留白當成不補', () => {
    expect(values({ start: '1', count: '2', step: '', pad: '' })).toEqual(['1', '2'])
  })
})

describe('buildSequence：錯誤指出是哪一格', () => {
  const err = (spec: Partial<SequenceSpec>, max = 2000) => {
    const r = buildSequence({ ...base, ...spec }, max)
    if (r.ok) throw new Error('應該要錯')
    return r
  }
  it.each([
    [{ start: 'A1' }, 'start'],
    [{ start: '-1' }, 'start'],
    [{ step: '0' }, 'step'],
    [{ step: '1.5' }, 'step'],
    [{ pad: '21' }, 'pad'],
    [{ count: '0' }, 'count'],
    [{ until: 'end' as const, end: '' }, 'end'],
    [{ until: 'end' as const, start: '10', end: '9' }, 'end'],
  ])('%o → %s', (spec, field) => {
    expect(err(spec).field).toBe(field)
  })

  it('超過上限不產生，請使用者分批', () => {
    const r = err({ count: '2001' })
    expect(r.field).toBe('count')
    expect(r.error).toContain('一次最多 2,000 筆')
    expect(r.error).toContain('2,001 筆')
    expect(err({ until: 'end', start: '1', end: '5000' }).field).toBe('end')
  })

  it('數字大到失去精確度時擋下', () => {
    expect(err({ start: '9007199254740990', count: '5' }).error).toContain('數字太大')
  })
})

describe('店內碼連號：每一筆自動算好 EAN-13 檢查碼', () => {
  it('前綴 20、補零 10 位，產生 12 位數，檢查時補上第 13 位', () => {
    const seq = values({ prefix: '20', start: '1', count: '3', pad: '10' })
    expect(seq).toEqual(['200000000001', '200000000002', '200000000003'])
    const checked = checkRows(rowsFromSequence(seq), { symbology: 'ean13', ec: 'M', template: '' })
    expect(checked.every(r => r.ok && r.appendedCheckDigit)).toBe(true)
    // GS1 mod-10（權重從最右邊起 3、1 交替）：2×1 + 1×3 = 5，檢查碼 5
    expect(checked.map(r => (r.ok ? r.normalized : ''))).toEqual(['2000000000015', '2000000000022', '2000000000039'])
  })
})

describe('sequencePreview 與 formatCount', () => {
  it('前三筆與最後一筆', () => {
    expect(sequencePreview(['a', 'b', 'c', 'd', 'e'])).toEqual({ head: ['a', 'b', 'c'], last: 'e' })
    expect(sequencePreview(['a', 'b'])).toEqual({ head: ['a', 'b'], last: null })
  })
  it('千分位', () => {
    expect([0, 999, 1000, 2000, 1234567].map(formatCount)).toEqual(['0', '999', '1,000', '2,000', '1,234,567'])
  })
})
