import { describe, it, expect } from 'vitest'
import { toQrByteString } from './qrByteString'
import { qrByteLength } from './qrCapacity'

describe('toQrByteString', () => {
  it('純 ASCII 原樣保留（網址等既有輸出不變）', () => {
    const url = 'https://www.pocketool.app/qrcode-studio/?a=1&b=%20'
    expect(toQrByteString(url)).toBe(url)
    expect(toQrByteString('WIFI:T:WPA;S:Cafe;P:1234;H:false;;')).toBe('WIFI:T:WPA;S:Cafe;P:1234;H:false;;')
  })

  it('中文轉成 UTF-8 位元組，每個位元組一個字元', () => {
    expect(toQrByteString('你好')).toBe('\xe4\xbd\xa0\xe5\xa5\xbd')
  })

  it('emoji（surrogate pair）轉成 4 個位元組', () => {
    expect(toQrByteString('😀')).toBe('\xf0\x9f\x98\x80')
  })

  it('落單的 surrogate 不會拋錯，換成 U+FFFD', () => {
    expect(() => toQrByteString('\ud800')).not.toThrow()
    expect(toQrByteString('\ud800')).toBe('\xef\xbf\xbd')
  })

  it('每個字元都落在 0–255，qrcode-generator 的 & 0xff 不會再截掉任何位元', () => {
    const s = toQrByteString('王小明｜口袋咖啡 ☕ 0912-345-678')
    for (const ch of s) expect(ch.charCodeAt(0)).toBeLessThan(256)
  })

  it('長度等於 UTF-8 位元組數，與容量檢查一致', () => {
    const text = 'BEGIN:VCARD\nN:王;小明;;;\nEND:VCARD'
    expect(toQrByteString(text).length).toBe(qrByteLength(text))
  })
})
