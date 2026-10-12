import { describe, it, expect } from 'vitest'
import {
  BARCODE_MAX_HEIGHT_RATIO, BARCODE_MIN_BAR_HEIGHT_MM, BARCODE_MIN_X_MM, MAX_LABEL_FONT_PT, MIN_LABEL_FONT_PT,
  QR_MIN_MODULE_MM, TEXT_WIDTH_SAFETY, ptToMm,
} from './paper'
import { LABEL_SHEETS, sheetById, sheetCells } from './labelSheets'
import { cellRect, contentBox } from './labelLayout'
import { estimateMeasure, emWidth, printFont } from './printFonts'
import {
  barcodeLabelModules, barcodeLabelSvg, fitLine, isBlocking, layoutCell, lineHeightMm, prefersSide, qrLabelModules, qrLabelSvg,
  type CellCode, type CellLayout, type TextStyle,
} from './labelContent'
import { encodeBarcode } from '../encodeBarcode'
import { makeQrMatrix } from './qrMatrix'

const family = printFont('jhenghei').stack
const style: TextStyle = { family, firstWeight: 700, weight: 400 }
const measure = estimateMeasure

const qr = (text: string): CellCode => ({ kind: 'qr', modules: qrLabelModules(makeQrMatrix(text, 'M')!) })
const bar = (sym: 'ean13' | 'code128' | 'code39' | 'itf14' | 'ean8', value: string): CellCode =>
  ({ kind: 'barcode', symbology: sym, modules: barcodeLabelModules(encodeBarcode(sym, value)), hri: value })

const boxOf = (sheetId: string, index = 4) => contentBox(cellRect(sheetById[sheetId]!, index), true).box

/** 碼與每一行字都在可放東西的範圍裡，彼此不重疊 */
function expectInside(layout: CellLayout, box: { w: number; h: number }) {
  const eps = 1e-6
  const parts = [...(layout.code ? [layout.code] : []), ...layout.lines]
  for (const p of parts) {
    expect(p.x).toBeGreaterThanOrEqual(-eps)
    expect(p.y).toBeGreaterThanOrEqual(-eps)
    expect(p.x + p.w).toBeLessThanOrEqual(box.w + eps)
    expect(p.y + p.h).toBeLessThanOrEqual(box.h + eps)
  }
  const sorted = [...parts].sort((a, b) => a.y - b.y || a.x - b.x)
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i]!
      const b = sorted[j]!
      const overlap = a.x < b.x + b.w - eps && b.x < a.x + a.w - eps && a.y < b.y + b.h - eps && b.y < a.y + a.h - eps
      expect(overlap, `${JSON.stringify(a)} 與 ${JSON.stringify(b)} 重疊`).toBe(false)
    }
  }
}

describe('字級：依長度自動縮小，太長就截斷並標示', () => {
  it('短的字用上限字級', () => {
    expect(fitLine('A1', 50, 12, family, 400, measure)).toEqual({ text: 'A1', pt: 12, truncated: false })
    expect(fitLine('A1', 50, 40, family, 400, measure).pt).toBe(MAX_LABEL_FONT_PT)
  })

  it('長一點的縮小到剛好放得下（取到 0.5 pt），寬度不超過可用寬度', () => {
    const f = fitLine('臺北市立圖書館總館', 30, 16, family, 400, measure)
    expect(f.truncated).toBe(false)
    expect(f.pt).toBeLessThan(16)
    expect(f.pt * 2).toBe(Math.round(f.pt * 2))
    expect(emWidth(measure, family, 400, f.text) * ptToMm(f.pt)).toBeLessThanOrEqual(30 * TEXT_WIDTH_SAFETY + 1e-9)
  })

  it('縮到最小字級還放不下：截斷、最後補「…」，標示 truncated，截完放得下', () => {
    const f = fitLine('國立臺灣大學醫學院附設醫院資訊室第二會議室投影機', 20, 16, family, 400, measure)
    expect(f.truncated).toBe(true)
    expect(f.pt).toBe(MIN_LABEL_FONT_PT)
    expect(f.text.endsWith('…')).toBe(true)
    expect(f.text.length).toBeGreaterThan(1)
    expect(emWidth(measure, family, 400, f.text) * ptToMm(MIN_LABEL_FONT_PT)).toBeLessThanOrEqual(20 * TEXT_WIDTH_SAFETY + 1e-9)
    // 一個字都放不下時只剩「…」
    expect(fitLine('國立臺灣大學', 1, 16, family, 400, measure).text).toBe('…')
  })

  it('高度不夠（上限比最小字級還小）時仍用最小字級', () => {
    expect(fitLine('A1', 50, 2, family, 400, measure).pt).toBe(MIN_LABEL_FONT_PT)
  })
})

describe('QR Code 加字', () => {
  it('沒有字時碼是正方形，取寬高較小的一邊、置中', () => {
    const box = { w: 61, h: 30.9 }
    const l = layoutCell(box, qr('https://example.com/a/1'), [], style, measure)
    expect(l.code).toEqual({ x: 15.05, y: 0, w: 30.9, h: 30.9 })
    expect(l.lines).toEqual([])
    expect(l.issue).toBeNull()
  })

  it('寬的格子：碼在左、字在右（左對齊）；第一行粗一點', () => {
    const box = boxOf('herwood-L3464')
    const l = layoutCell(box, qr('https://example.com/asset/TP-0001'), ['TP-0001', '筆記型電腦', '總務處'], style, measure)
    expect(l.code!.x).toBe(0)
    expect(l.code!.w).toBe(box.h)
    expect(l.lines.map(x => x.align)).toEqual(['left', 'left', 'left'])
    expect(l.lines.map(x => x.weight)).toEqual([700, 400, 400])
    expect(l.lines.every(x => x.x > l.code!.w)).toBe(true)
    expectInside(l, box)
  })

  it('右邊留給字的寬度不到 15 mm 的小格子：碼在上、字在下（置中）', () => {
    const box = boxOf('herwood-L2437')
    expect(prefersSide(box)).toBe(false)
    const l = layoutCell(box, qr('https://example.com/a/TP-0001'), ['TP-0001', '筆記型電腦', '資訊室第二會議室'], style, measure)
    expect(l.lines.map(x => x.align)).toEqual(['center', 'center', 'center'])
    expect(l.truncated).toBe(false)
    expect(l.code!.y).toBeLessThan(l.lines[0]!.y)
    expectInside(l, box)
  })

  it('同一個格子的排法只看形狀：字的長短不同，碼的位置與大小都一樣，太長的截斷', () => {
    const box = boxOf('herwood-L3464')
    expect(prefersSide(box)).toBe(true)
    const short = layoutCell(box, qr('https://example.com/a/1'), ['TP-0001', '投影機'], style, measure)
    const long = layoutCell(box, qr('https://example.com/a/2'), ['TP-0002', '國立臺灣大學醫學院附設醫院第二會議室'], style, measure)
    expect(long.code).toEqual(short.code)
    expect(long.lines.map(x => x.align)).toEqual(['left', 'left'])
    expect(long.truncated).toBe(true)
    expect(long.lines[1]!.text.endsWith('…')).toBe(true)
  })

  it('空白的行不印', () => {
    const box = boxOf('herwood-L3464')
    const l = layoutCell(box, qr('A'), ['', 'B', '  '], style, measure)
    expect(l.lines.map(x => x.text)).toEqual(['B'])
  })

  it('小方塊太小時擋下，稍小時只提醒', () => {
    const long = 'https://example.com/' + 'x'.repeat(400)
    const tiny = layoutCell({ w: 12, h: 12 }, qr(long), [], style, measure)
    expect(tiny.issue?.kind).toBe('qr-tiny')
    expect(isBlocking(tiny.issue)).toBe(true)
    expect(tiny.moduleMm).toBeLessThan(QR_MIN_MODULE_MM)
    const small = layoutCell({ w: 11, h: 11 }, qr('https://example.com/asset/TP-0001?from=label'), [], style, measure)
    expect(small.issue?.kind).toBe('qr-small')
    expect(isBlocking(small.issue)).toBe(false)
  })

  it('完全沒有空間時擋下', () => {
    expect(layoutCell({ w: 0, h: 10 }, qr('A'), [], style, measure).issue).toEqual({ kind: 'no-room' })
  })
})

describe('一維條碼的最小尺寸', () => {
  it('EAN-13 在 70 mm 寬的格子裡：窄條至少 80%（0.264 mm），條高不超過寬度的六成，下面一行號碼', () => {
    const box = boxOf('herwood-L3270', 4)
    const l = layoutCell(box, bar('ean13', '4710088331237'), [], style, measure)
    expect(l.issue).toBeNull()
    expect(l.moduleMm).toBeGreaterThanOrEqual(BARCODE_MIN_X_MM.ean13)
    expect(l.moduleMm).toBeLessThanOrEqual(0.66)
    expect(l.code!.h).toBeLessThanOrEqual(l.code!.w * BARCODE_MAX_HEIGHT_RATIO + 1e-6)
    expect(l.lines).toHaveLength(1)
    expect(l.lines[0]).toMatchObject({ text: '4710088331237', hri: true, align: 'center' })
    expectInside(l, box)
  })

  it('EAN-13 在 25.4 mm 寬的格子裡低於 80% 倍率：擋下', () => {
    const l = layoutCell(boxOf('longder-LD-8101', 8), bar('ean13', '4710088331237'), [], style, measure)
    expect(l.issue).toMatchObject({ kind: 'barcode-narrow', minMm: 0.264 })
    expect(isBlocking(l.issue)).toBe(true)
  })

  it('Code 128 窄條太細：低於 0.19 mm 擋下，0.19 到 0.25 mm 提醒', () => {
    const box = boxOf('longder-LD-8101', 8)
    const narrow = layoutCell(box, bar('code128', 'TP-0001'), [], style, measure)
    expect(narrow.issue?.kind).toBe('barcode-narrow')
    const thin = layoutCell(box, bar('code128', 'A001'), [], style, measure)
    expect(thin.issue).toMatchObject({ kind: 'barcode-thin', recommendMm: 0.25 })
    expect(isBlocking(thin.issue)).toBe(false)
    const fine = layoutCell(boxOf('herwood-L3464'), bar('code128', 'TP-0001'), ['筆記型電腦'], style, measure)
    expect(fine.issue).toBeNull()
  })

  it('條高太矮時先把字縮到最小，還是太矮就擋下', () => {
    const box = { w: 60, h: 14 }
    const l = layoutCell(box, bar('code128', 'TP-0001'), ['第一行', '第二行', '第三行'], style, measure)
    expect(l.lines.filter(x => !x.hri).every(x => x.pt === MIN_LABEL_FONT_PT)).toBe(true)
    expect(l.issue).toMatchObject({ kind: 'barcode-short', minMm: BARCODE_MIN_BAR_HEIGHT_MM })
    expect(isBlocking(l.issue)).toBe(true)
  })

  it('ITF-14 在 3 欄的標籤上只提醒（物流外箱建議 0.495 mm 以上）；2 欄的大標籤沒有提醒', () => {
    const three = layoutCell(boxOf('herwood-L3464'), bar('itf14', '15400141288763'), [], style, measure)
    expect(three.issue).toMatchObject({ kind: 'barcode-thin', recommendMm: 0.495 })
    const two = layoutCell(boxOf('herwood-L5799', 2), bar('itf14', '15400141288763'), [], style, measure)
    expect(two.issue).toBeNull()
  })
})

describe('每個型號、每一格：放得下的東西都在範圍裡，不重疊', () => {
  const codes: [string, CellCode][] = [
    ['QR Code', qr('https://example.com/asset/TP-0001')],
    ['Code 128', bar('code128', 'TP-0001')],
    ['EAN-8', bar('ean8', '55123457')],
  ]
  it.each(LABEL_SHEETS.map(s => [s.id]))('%s', (id) => {
    const s = sheetById[id]!
    for (const index of [0, s.columns - 1, sheetCells(s) - 1, Math.floor(sheetCells(s) / 2)]) {
      const { box } = contentBox(cellRect(s, index), true)
      for (const [, code] of codes) {
        const l = layoutCell(box, code, ['TP-0001', '筆記型電腦', '總務處'], style, measure)
        if (l.code) expectInside(l, box)
        for (const line of l.lines) expect(line.h).toBeCloseTo(lineHeightMm(line.pt), 2)
      }
    }
  })
})

describe('碼的 SVG', () => {
  it('QR Code：viewBox 含四周 4 格留白', () => {
    const m = makeQrMatrix('A', 'M')!
    expect(qrLabelSvg(m).viewBox).toBe(`0 0 ${m.size + 8} ${m.size + 8}`)
    expect(qrLabelModules(m)).toBe(m.size + 8)
  })

  it('一維條碼：viewBox 的寬是總模組數，高照條高換算（ITF-14 的外框算在裡面）', () => {
    const p = encodeBarcode('ean13', '4710088331237')
    expect(barcodeLabelModules(p)).toBe(95 + 11 + 7)
    expect(barcodeLabelSvg(p, 0.33, 16.5).viewBox).toBe('0 0 113 50')
    const itf = encodeBarcode('itf14', '15400141288763')
    const parts = barcodeLabelSvg(itf, 0.5, 20)
    expect(parts.viewBox).toBe(`0 0 ${barcodeLabelModules(itf)} 40`)
    expect(parts.d.startsWith('M0 0h')).toBe(true)
  })
})
