import { describe, it, expect, beforeEach } from 'vitest'
import { OFFSET_STORAGE_KEY, forgetPrinterOffset, loadPrinterOffset, savePrinterOffset } from './batch-label-offset'

beforeEach(() => localStorage.clear())

describe('記住這台印表機的位移', () => {
  it('只存 x、y 兩個數字（取到 0.1 mm、限制在 ±10 mm）', () => {
    savePrinterOffset(1.234, -30)
    expect(localStorage.length).toBe(1)
    const raw = localStorage.getItem(OFFSET_STORAGE_KEY)!
    expect(JSON.parse(raw)).toEqual({ x: 1.2, y: -10 })
    expect(Object.keys(JSON.parse(raw))).toEqual(['x', 'y'])
    expect(loadPrinterOffset()).toEqual({ x: 1.2, y: -10 })
  })

  it('取消就刪掉', () => {
    savePrinterOffset(1, 1)
    forgetPrinterOffset()
    expect(localStorage.getItem(OFFSET_STORAGE_KEY)).toBeNull()
    expect(loadPrinterOffset()).toBeNull()
  })

  it('沒有記住、格式不對、不是數字時當成沒有記住', () => {
    expect(loadPrinterOffset()).toBeNull()
    for (const bad of ['not json', '[1,2]', '{"x":"1","y":2}', '{"x":1}', 'null', '{"x":null,"y":0}']) {
      localStorage.setItem(OFFSET_STORAGE_KEY, bad)
      expect(loadPrinterOffset(), bad).toBeNull()
    }
    // 被改成超出範圍的數字也拉回範圍裡
    localStorage.setItem(OFFSET_STORAGE_KEY, '{"x":99,"y":-0.04}')
    expect(loadPrinterOffset()).toEqual({ x: 10, y: 0 })
  })

  it('儲存空間不能用時不丟錯', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!
    Object.defineProperty(globalThis, 'localStorage', { get: () => { throw new Error('blocked') }, configurable: true })
    try {
      expect(() => savePrinterOffset(1, 1)).not.toThrow()
      expect(() => forgetPrinterOffset()).not.toThrow()
      expect(loadPrinterOffset()).toBeNull()
    } finally {
      Object.defineProperty(globalThis, 'localStorage', original)
    }
  })
})
