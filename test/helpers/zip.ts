/**
 * 測試用的 ZIP 讀取器：照 PKWARE APPNOTE 從 end of central directory 找中央目錄，再逐筆對照 local header。
 * 只讀 STORE（不壓縮）的檔案，本站的 ZIP 只寫這一種。結構對不上就丟錯，測試直接紅。
 */

export interface ReadEntry {
  name: string
  flags: number
  method: number
  crc: number
  size: number
  time: number
  date: number
  data: Uint8Array
}

function must(cond: boolean, message: string): void {
  if (!cond) throw new Error(`ZIP 結構不對：${message}`)
}

export function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

export function readZip(zip: Uint8Array): ReadEntry[] {
  const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
  const eocd = zip.length - 22
  must(eocd >= 0 && dv.getUint32(eocd, true) === 0x06054b50, 'end of central directory 簽章')
  const count = dv.getUint16(eocd + 10, true)
  must(dv.getUint16(eocd + 8, true) === count, '這片與總共的檔案數不同')
  const cdSize = dv.getUint32(eocd + 12, true)
  const cdOffset = dv.getUint32(eocd + 16, true)
  must(cdOffset + cdSize === eocd, '中央目錄的位置與大小')
  const decoder = new TextDecoder('utf-8', { fatal: true })
  const out: ReadEntry[] = []
  let p = cdOffset
  for (let i = 0; i < count; i++) {
    must(dv.getUint32(p, true) === 0x02014b50, `第 ${i + 1} 筆中央目錄簽章`)
    const flags = dv.getUint16(p + 8, true)
    const method = dv.getUint16(p + 10, true)
    const time = dv.getUint16(p + 12, true)
    const date = dv.getUint16(p + 14, true)
    const crc = dv.getUint32(p + 16, true)
    const csize = dv.getUint32(p + 20, true)
    const size = dv.getUint32(p + 24, true)
    must(csize === size && method === 0, '只有 STORE')
    const nameLen = dv.getUint16(p + 28, true)
    const extraLen = dv.getUint16(p + 30, true)
    const commentLen = dv.getUint16(p + 32, true)
    const local = dv.getUint32(p + 42, true)
    const name = decoder.decode(zip.subarray(p + 46, p + 46 + nameLen))
    must(dv.getUint32(local, true) === 0x04034b50, `${name} 的 local header 簽章`)
    must(dv.getUint16(local + 6, true) === flags, `${name} 的旗標`)
    must(dv.getUint16(local + 8, true) === method, `${name} 的壓縮方式`)
    must(dv.getUint32(local + 14, true) === crc, `${name} 的 CRC`)
    must(dv.getUint32(local + 18, true) === size && dv.getUint32(local + 22, true) === size, `${name} 的大小`)
    const lNameLen = dv.getUint16(local + 26, true)
    const lExtra = dv.getUint16(local + 28, true)
    must(decoder.decode(zip.subarray(local + 30, local + 30 + lNameLen)) === name, `${name} 的檔名`)
    const start = local + 30 + lNameLen + lExtra
    out.push({ name, flags, method, crc, size, time, date, data: zip.subarray(start, start + size) })
    p += 46 + nameLen + extraLen + commentLen
  }
  must(p === eocd, '中央目錄後面還有多的資料')
  return out
}
