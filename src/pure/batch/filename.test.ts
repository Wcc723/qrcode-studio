import { describe, it, expect } from 'vitest'
import { sanitizeBaseName, serialName, dedupeName, MAX_BASE_CHARS } from './filename'

describe('sanitizeBaseName', () => {
  it('檔名不能用的字元換成底線', () => {
    expect(sanitizeBaseName('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j')
    expect(sanitizeBaseName('tab\there\u0007')).toBe('tab here_')
  })

  it('網址當檔名也不會出現斜線', () => {
    expect(sanitizeBaseName('https://example.com/a?b=1')).toBe('https___example.com_a_b=1')
  })

  it('去掉頭尾的空白與點，連續空白縮成一個', () => {
    expect(sanitizeBaseName('  ..名稱   一  .. ')).toBe('名稱 一')
  })

  it('清完是空的回空字串（呼叫端改用流水號）', () => {
    expect(sanitizeBaseName('...')).toBe('')
    expect(sanitizeBaseName('   ')).toBe('')
  })

  it('Windows 保留名稱前面加底線', () => {
    expect(sanitizeBaseName('CON')).toBe('_CON')
    expect(sanitizeBaseName('lpt1')).toBe('_lpt1')
    expect(sanitizeBaseName('CONSOLE')).toBe('CONSOLE')
  })

  it('限制長度（以字元計，不切壞 emoji）', () => {
    const long = '中'.repeat(200)
    expect([...sanitizeBaseName(long)]).toHaveLength(MAX_BASE_CHARS)
    expect(sanitizeBaseName('😀'.repeat(100))).toBe('😀'.repeat(MAX_BASE_CHARS))
  })

  it('NFD 轉成 NFC', () => {
    expect(sanitizeBaseName('café')).toBe('café')
  })
})

describe('serialName', () => {
  it('補零到總筆數的位數，至少 3 位', () => {
    expect(serialName(0, 5)).toBe('001')
    expect(serialName(41, 2000)).toBe('0042')
    expect(serialName(1999, 2000)).toBe('2000')
  })
})

describe('dedupeName', () => {
  it('重名加 (2)、(3)，不分大小寫，NFC 與 NFD 視為同名', () => {
    const taken = new Set<string>()
    expect(dedupeName('A.png', taken)).toBe('A.png')
    expect(dedupeName('a.png', taken)).toBe('a (2).png')
    expect(dedupeName('A.png', taken)).toBe('A (3).png')
    expect(dedupeName('café.svg', taken)).toBe('café.svg')
    expect(dedupeName('café.svg', taken)).toBe('café (2).svg')
  })

  it('剛好跟加過號碼的名字撞到也會再往下加', () => {
    const taken = new Set<string>()
    dedupeName('x (2).png', taken)
    dedupeName('x.png', taken)
    expect(dedupeName('x.png', taken)).toBe('x (3).png')
  })
})
