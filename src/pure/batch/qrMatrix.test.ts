import { describe, it, expect } from 'vitest'
import { makeQrMatrix, qrRuns, qrPathData, qrSvg, qrRasterPlan } from './qrMatrix'
import { qrModuleCount, QUIET_ZONE_MODULES } from '../qrGeometry'
import { toQrByteString } from '../qrByteString'
import type { ErrorCorrectionLevel } from '@/types'

const SAMPLES = [
  'https://example.com/asset/TP-2026-00001',
  '0912345678',
  'HTTPS://EXAMPLE.COM/A-1',
  '財產標籤 筆記型電腦',
  'a'.repeat(500),
]

describe('makeQrMatrix', () => {
  it.each(SAMPLES.flatMap(s => (['L', 'M', 'Q', 'H'] as ErrorCorrectionLevel[]).map(ec => [s.slice(0, 30), s, ec] as const)))(
    '%s（%s）：模組數跟 qrGeometry 推的一樣（單張產生器用同一套）', (_label, text, ec) => {
      const m = makeQrMatrix(text, ec)!
      expect(m.size).toBe(qrModuleCount(toQrByteString(text), ec))
      expect(m.dark.length).toBe(m.size * m.size)
    })

  it('三個角的定位圖案：左上 7×7 外框是深色', () => {
    const m = makeQrMatrix('https://example.com', 'M')!
    for (let i = 0; i < 7; i++) {
      expect(m.dark[i]).toBe(1)                 // 第一列
      expect(m.dark[i * m.size]).toBe(1)        // 第一欄
      expect(m.dark[6 * m.size + i]).toBe(1)    // 第七列
    }
    expect(m.dark[7]).toBe(0) // 定位圖案旁的分隔線是淺色
  })

  it('超過容量回 null', () => {
    expect(makeQrMatrix('中'.repeat(425), 'H')).toBeNull()
  })
})

describe('qrRuns 與 qrPathData', () => {
  const m = makeQrMatrix('https://example.com/asset/TP-0001', 'M')!

  it('合併後的長度加起來等於深色模組數，同一列的段不相連', () => {
    const runs = qrRuns(m)
    expect(runs.reduce((n, [, , len]) => n + len, 0)).toBe(m.dark.reduce((n, d) => n + d, 0))
    for (let i = 1; i < runs.length; i++) {
      const [r0, c0, l0] = runs[i - 1]!
      const [r1, c1] = runs[i]!
      if (r0 === r1) expect(c1).toBeGreaterThan(c0 + l0)
    }
    // 合併之後形狀數明顯比模組數少
    expect(runs.length).toBeLessThan(m.dark.reduce((n, d) => n + d, 0) / 2)
  })

  it('path 從四周留白之後開始畫', () => {
    expect(qrPathData(m).startsWith(`M${QUIET_ZONE_MODULES} ${QUIET_ZONE_MODULES}h7v1h-7z`)).toBe(true)
  })
})

describe('qrSvg', () => {
  it('viewBox 是模組數加兩側各 4 格，寬高是選的圖片大小，白底黑碼', () => {
    const m = makeQrMatrix('https://example.com', 'M')!
    const svg = qrSvg(m, 600)
    const full = m.size + 8
    expect(svg).toContain(`width="600" height="600" viewBox="0 0 ${full} ${full}"`)
    expect(svg).toContain(`<rect width="${full}" height="${full}" fill="#ffffff"/>`)
    expect(svg).toContain('<path fill="#000000" d="M4 4h7v1h-7z')
  })
})

describe('qrRasterPlan：PNG 的畫法', () => {
  it.each([300, 600, 1000, 1500])('%i 像素：整數模組、四邊至少 4 格留白、碼置中', (size) => {
    const m = makeQrMatrix('https://example.com/asset/TP-2026-00001', 'M')!
    const plan = qrRasterPlan(m, size)!
    expect([plan.width, plan.height]).toEqual([size, size])
    const minX = Math.min(...plan.rects.map(r => r.x))
    const minY = Math.min(...plan.rects.map(r => r.y))
    const maxX = Math.max(...plan.rects.map(r => r.x + r.w))
    const maxY = Math.max(...plan.rects.map(r => r.y + r.h))
    const moduleSize = plan.rects.find(r => r.y === minY)!.h
    expect(Number.isInteger(moduleSize)).toBe(true)
    expect(maxX - minX).toBe(m.size * moduleSize)
    for (const gap of [minX, minY, size - maxX, size - maxY]) expect(gap / moduleSize).toBeGreaterThanOrEqual(QUIET_ZONE_MODULES)
    expect(Math.abs(minX - (size - maxX))).toBeLessThanOrEqual(1)
  })

  it('圖片小到連 1 像素的模組都放不下時回 null', () => {
    const m = makeQrMatrix('https://example.com', 'M')!
    expect(qrRasterPlan(m, m.size + 7)).toBeNull()
    expect(qrRasterPlan(m, m.size + 8)).not.toBeNull()
  })
})
