/**
 * 零相依的 ZIP 寫入（STORE，不壓縮）。PNG 本來就壓縮過，SVG 一張只有幾 KB，再壓縮省不到多少，
 * 換來的是不必多帶一個壓縮套件。格式照 PKWARE APPNOTE：local file header、資料、central directory、
 * end of central directory。檔名用 UTF-8 並設通用旗標 bit 11，中文檔名在 Windows、macOS 解壓縮都正確。
 * 不做 ZIP64：超過 65,535 個檔案或 4 GiB 時丟 ZipTooLargeError，請使用者分批（單次上限遠低於這兩個數字）。
 *
 * 回傳的 parts 直接交給 `new Blob(parts, { type: 'application/zip' })`，不必再複製進同一塊大記憶體。
 */

export const ZIP_MAX_ENTRIES = 0xffff
/** 所有 local header 加資料加中央目錄都要在 4 GiB 以內（offset 欄位是 32 位元） */
export const ZIP_MAX_BYTES = 0xffffffff

export class ZipTooLargeError extends Error {
  constructor(message: string) { super(message); this.name = 'ZipTooLargeError' }
}

export interface ZipEntry {
  /** 平的檔名（不能有路徑），呼叫端先用 filename.ts 清理與去重 */
  name: string
  data: Uint8Array
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

/** CRC-32（IEEE 802.3） */
export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8)
  return ~c >>> 0
}

/** MS-DOS 日期時間（當地時間，秒數取偶數）；範圍是 1980 到 2107 年 */
export function dosDateTime(d: Date): { date: number; time: number } {
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1980) return { date: (1 << 5) | 1, time: 0 }
  if (d.getFullYear() > 2107) return { date: (127 << 9) | (12 << 5) | 31, time: (23 << 11) | (59 << 5) | 29 }
  return {
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  }
}

const UTF8_FLAG = 0x0800
const VERSION = 20

function checkName(name: string): void {
  // eslint-disable-next-line no-control-regex
  if (!name || /[/\\\u0000]/.test(name) || name === '.' || name === '..') {
    throw new TypeError(`ZIP 檔名不合法：${JSON.stringify(name)}`)
  }
}

export type ZipPart = Uint8Array<ArrayBuffer>

export function zipParts(entries: readonly ZipEntry[], now: Date = new Date()): ZipPart[] {
  if (entries.length > ZIP_MAX_ENTRIES) throw new ZipTooLargeError(`${entries.length} entries`)
  const enc = new TextEncoder()
  const seen = new Set<string>()
  const parts: ZipPart[] = []
  const central: ZipPart[] = []
  const { date, time } = dosDateTime(now)
  let offset = 0

  for (const e of entries) {
    const nameText = e.name.normalize('NFC')
    checkName(nameText)
    const key = nameText.toLowerCase()
    if (seen.has(key)) throw new TypeError(`ZIP 裡有重複的檔名：${nameText}`)
    seen.add(key)
    const name = enc.encode(nameText)
    if (name.length > 0xffff) throw new TypeError('ZIP 檔名太長')
    const size = e.data.length
    const crc = crc32(e.data)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, VERSION, true)
    local.setUint16(6, UTF8_FLAG, true)
    local.setUint16(8, 0, true) // STORE
    local.setUint16(10, time, true)
    local.setUint16(12, date, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, size, true)
    local.setUint32(22, size, true)
    local.setUint16(26, name.length, true)
    local.setUint16(28, 0, true)

    const header = new DataView(new ArrayBuffer(46))
    header.setUint32(0, 0x02014b50, true)
    header.setUint16(4, VERSION, true) // version made by：0 = MS-DOS 相容屬性
    header.setUint16(6, VERSION, true)
    header.setUint16(8, UTF8_FLAG, true)
    header.setUint16(10, 0, true)
    header.setUint16(12, time, true)
    header.setUint16(14, date, true)
    header.setUint32(16, crc, true)
    header.setUint32(20, size, true)
    header.setUint32(24, size, true)
    header.setUint16(28, name.length, true)
    // extra、comment、disk、內部與外部屬性都是 0
    header.setUint32(42, offset, true)

    parts.push(new Uint8Array(local.buffer), name, e.data as ZipPart)
    central.push(new Uint8Array(header.buffer), name)
    offset += 30 + name.length + size
    if (offset > ZIP_MAX_BYTES) throw new ZipTooLargeError('size')
  }

  const cdSize = central.reduce((n, p) => n + p.length, 0)
  if (offset + cdSize + 22 > ZIP_MAX_BYTES) throw new ZipTooLargeError('central directory')
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(8, entries.length, true)
  eocd.setUint16(10, entries.length, true)
  eocd.setUint32(12, cdSize, true)
  eocd.setUint32(16, offset, true)
  return [...parts, ...central, new Uint8Array(eocd.buffer)]
}
