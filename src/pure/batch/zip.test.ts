import { describe, it, expect } from 'vitest'
import { crc32, dosDateTime, zipParts, ZipTooLargeError, ZIP_MAX_ENTRIES, type ZipEntry } from './zip'
import { readZip, concat } from '../../../test/helpers/zip'

const enc = new TextEncoder()

describe('crc32', () => {
  it('標準測試向量', () => {
    expect(crc32(enc.encode('123456789'))).toBe(0xcbf43926)
    expect(crc32(new Uint8Array(0))).toBe(0)
    expect(crc32(enc.encode('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339)
  })
})

describe('dosDateTime', () => {
  it('當地時間，秒數取偶數', () => {
    const { date, time } = dosDateTime(new Date(2026, 9, 13, 14, 30, 59))
    expect(date).toBe(((2026 - 1980) << 9) | (10 << 5) | 13)
    expect(time).toBe((14 << 11) | (30 << 5) | 29)
  })
  it('1980 年以前與無效日期退回 1980-01-01', () => {
    expect(dosDateTime(new Date(1970, 0, 1))).toEqual({ date: (1 << 5) | 1, time: 0 })
    expect(dosDateTime(new Date('x'))).toEqual({ date: (1 << 5) | 1, time: 0 })
  })
})

describe('zipParts：照 APPNOTE 讀得回來', () => {
  const now = new Date(2026, 9, 13, 9, 0, 0)

  it('STORE、UTF-8 檔名旗標、CRC、大小、local header 與中央目錄一致，內容一個位元組都不差', () => {
    const entries: ZipEntry[] = [
      { name: 'TP-0001.svg', data: enc.encode('<svg/>') },
      { name: '財產標籤 筆電.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255]) },
      { name: 'empty.txt', data: new Uint8Array(0) },
    ]
    const files = readZip(concat(zipParts(entries, now)))
    expect(files.map(f => f.name)).toEqual(['TP-0001.svg', '財產標籤 筆電.png', 'empty.txt'])
    for (const [i, f] of files.entries()) {
      expect(f.method).toBe(0)
      expect(f.flags & 0x0800).toBe(0x0800)
      expect(f.crc).toBe(crc32(entries[i]!.data))
      expect([...f.data]).toEqual([...entries[i]!.data])
      expect(f.date).toBe(dosDateTime(now).date)
    }
  })

  it('沒有檔案時只有 end of central directory', () => {
    const zip = concat(zipParts([], now))
    expect(zip.length).toBe(22)
    expect(readZip(zip)).toEqual([])
  })

  it('檔名轉成 NFC', () => {
    const files = readZip(concat(zipParts([{ name: 'café.png', data: new Uint8Array([1]) }], now)))
    expect(files[0]!.name).toBe('café.png')
  })

  it('重複的檔名、路徑、空檔名丟錯（呼叫端要先去重）', () => {
    const d = new Uint8Array([1])
    expect(() => zipParts([{ name: 'a.png', data: d }, { name: 'A.png', data: d }])).toThrow(/重複/)
    expect(() => zipParts([{ name: 'dir/a.png', data: d }])).toThrow(TypeError)
    expect(() => zipParts([{ name: '..', data: d }])).toThrow(TypeError)
    expect(() => zipParts([{ name: '', data: d }])).toThrow(TypeError)
  })

  it('超過 65,535 個檔案請使用者分批', () => {
    const many = Array.from({ length: ZIP_MAX_ENTRIES + 1 }, (_, i) => ({ name: `${i}`, data: new Uint8Array(0) }))
    expect(() => zipParts(many)).toThrow(ZipTooLargeError)
  })
})
