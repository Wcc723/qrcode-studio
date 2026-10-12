import { describe, it, expect } from 'vitest'
// qr-code-styling 把 qrcode-generator 打包在自己的 dist 裡；本站另外精確鎖版裝一份（dependency，批次產生直接用它編碼），這裡拿它來對帳。
// 版本要跟它打包的那一份相同：升級 qr-code-styling 時先確認，兩邊不同就一起改（見 docs/quiet-zone.md）。
import qrcode from 'qrcode-generator'
import { qrMode, qrVersion, qrModuleCount, quietZoneGeometry, QUIET_ZONE_MODULES } from './qrGeometry'
import type { ErrorCorrectionLevel } from '@/types'

const LEVELS: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']

/** qr-code-styling 內部用的 qrcode-generator：指定版本時放不放得下（放不下會丟 code length overflow） */
function fitsAt(v: number, ec: ErrorCorrectionLevel, data: string): boolean {
  try {
    const qr = qrcode(v as TypeNumber, ec)
    qr.addData(data, qrMode(data))
    qr.make()
    return true
  } catch {
    return false
  }
}

/** 照我們的推導，版本 v 最多放幾個字（在純函式上二分搜尋，很快） */
function ourMaxLength(v: number, ec: ErrorCorrectionLevel, ch: string): number {
  let lo = 0, hi = 8000
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    const got = qrVersion(ch.repeat(mid), ec)
    if (got !== null && got <= v) lo = mid
    else hi = mid - 1
  }
  return lo
}

describe('qrMode：與 qr-code-styling 自動選模式的規則相同', () => {
  it.each([
    ['0123456789', 'Numeric'],
    ['HELLO WORLD $%*+-./:', 'Alphanumeric'],
    ['https://example.com', 'Byte'],
    ['HTTPS://EXAMPLE.COM', 'Alphanumeric'],
    ['\xe4\xbd\xa0', 'Byte'],
  ] as const)('%s → %s', (data, mode) => {
    expect(qrMode(data)).toBe(mode)
  })
})

describe('qrVersion：版本邊界跟參考實作一致', () => {
  // 一般文字（網址、中文轉成的位元組）逐版本驗；數字與大寫英數驗「有幾個字」欄位換段的那幾個版本。
  const plan = [
    ['一般文字', 'a', Array.from({ length: 40 }, (_, i) => i + 1)],
    ['數字', '7', [1, 9, 10, 26, 27, 40]],
    ['大寫英數', 'A', [1, 9, 10, 26, 27, 40]],
  ] as const
  for (const ec of LEVELS) {
    for (const [label, ch, versions] of plan) {
      it(`${ec}、${label}：剛好放滿時是這個版本，多一個字就要下一版`, () => {
        for (const v of versions) {
          const max = ourMaxLength(v, ec, ch)
          expect(fitsAt(v, ec, ch.repeat(max)), `${ec} v${v} 放 ${max} 字`).toBe(true)
          expect(fitsAt(v, ec, ch.repeat(max + 1)), `${ec} v${v} 放 ${max + 1} 字`).toBe(false)
          expect(qrModuleCount(ch.repeat(max), ec)).toBe(17 + 4 * v)
        }
      })
    }
  }

  it('自動選版本的結果與參考實作相同', () => {
    for (const [data, ec] of [['https://example.com', 'M'], ['0123456789'.repeat(20), 'Q'], ['HELLO WORLD', 'H'], ['a'.repeat(1000), 'L']] as const) {
      const qr = qrcode(0, ec)
      qr.addData(data, qrMode(data))
      qr.make()
      expect(qrModuleCount(data, ec)).toBe(qr.getModuleCount())
    }
  })

  it('版本 40 也放不下時回 null', () => {
    expect(qrVersion('a'.repeat(2954), 'L')).toBeNull()
    expect(qrModuleCount('a'.repeat(1274), 'H')).toBeNull()
  })

  it('https://example.com 用 M 是版本 2（每邊 25 格）', () => {
    expect(qrVersion('https://example.com', 'M')).toBe(2)
    expect(qrModuleCount('https://example.com', 'M')).toBe(25)
  })
})

/** 照 qr-code-styling 1.9 畫點的公式（roundSize 開著時無條件捨去）重算一次，確認給的 margin 會被畫成預期的位置 */
function libraryLayout(size: number, margin: number, count: number) {
  const dot = Math.floor((size - 2 * margin) / count)
  const start = Math.floor((size - count * dot) / 2)
  return { dot, start, end: size - start - count * dot }
}

describe('quietZoneGeometry：四周至少 4 個模組，整張圖維持使用者選的大小', () => {
  it('1000 px、25 格：每格 30 px、四周 125 px（約 4.17 格）', () => {
    expect(quietZoneGeometry(1000, 25)).toEqual({ size: 1000, moduleCount: 25, moduleSize: 30, margin: 125, quietZone: 125 / 30 })
  })

  it('滑桿的每一個大小 × 版本 1 到 40：四邊都至少 4 格，套件畫出來的位置與我們算的一樣', () => {
    for (let size = 200; size <= 2000; size += 100) {
      for (let v = 1; v <= 40; v++) {
        const count = 17 + 4 * v
        const g = quietZoneGeometry(size, count)
        expect(g, `${size} px v${v}`).not.toBeNull()
        const { moduleSize, margin } = g!
        expect(moduleSize).toBeGreaterThanOrEqual(1)
        const lay = libraryLayout(size, margin, count)
        expect(lay.dot).toBe(moduleSize)
        expect(lay.start).toBe(margin)
        expect(lay.start / moduleSize).toBeGreaterThanOrEqual(QUIET_ZONE_MODULES)
        expect(lay.end / moduleSize).toBeGreaterThanOrEqual(QUIET_ZONE_MODULES)
        expect(lay.start + count * moduleSize + lay.end).toBe(size)
        // 模組已經取最大：再大 1 px 就放不下兩側各 4 格
        expect((count + 2 * QUIET_ZONE_MODULES) * (moduleSize + 1)).toBeGreaterThan(size)
      }
    }
  })

  it('連 1 像素的模組都放不下時回 null（下載要擋下來）', () => {
    expect(quietZoneGeometry(184, 177)).toBeNull()
    expect(quietZoneGeometry(185, 177)).not.toBeNull()
    expect(quietZoneGeometry(1000, null)).toBeNull()
    expect(quietZoneGeometry(Number.NaN, 25)).toBeNull()
  })
})
