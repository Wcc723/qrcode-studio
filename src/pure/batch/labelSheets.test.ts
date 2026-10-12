import { describe, it, expect } from 'vitest'
import { A4 } from './paper'
import { LABEL_SHEETS, DEFAULT_SHEET_ID, sheetById, sheetCells, sheetLabel, type LabelSheet } from './labelSheets'
import { cellRect, gridBottom, gridFitsA4, gridRight } from './labelLayout'

/**
 * 型號資料的檢查。數字來自官方 Word 範本的設定（不是實測），所以這裡驗的是「彼此對得上」：
 * 每一格都在 A4 裡、左右邊界加上欄寬欄距剛好是紙寬、下邊界跟用紙高反推的數字一致。
 */

describe('型號清單', () => {
  it('兩個品牌都有，第一批約二三十種，id 與型號不重複', () => {
    expect(LABEL_SHEETS.length).toBeGreaterThanOrEqual(20)
    expect(new Set(LABEL_SHEETS.map(s => s.id)).size).toBe(LABEL_SHEETS.length)
    expect(new Set(LABEL_SHEETS.map(s => `${s.brand}/${s.model}`)).size).toBe(LABEL_SHEETS.length)
    expect(LABEL_SHEETS.filter(s => s.brand === 'herwood').length).toBeGreaterThanOrEqual(10)
    expect(LABEL_SHEETS.filter(s => s.brand === 'longder').length).toBeGreaterThanOrEqual(10)
    expect(sheetById[DEFAULT_SHEET_ID]).toBeDefined()
  })

  it('涵蓋常見的格局：2×5、2×8、3×7、3×8、3×9、3×10、3×11、4×10、5×11、4×16、7×16', () => {
    const formats = new Set(LABEL_SHEETS.map(s => `${s.columns}x${s.rows}`))
    for (const f of ['2x5', '2x8', '3x7', '3x8', '3x9', '3x10', '3x11', '4x10', '5x11', '4x16', '7x16']) expect(formats, f).toContain(f)
  })

  it('每一筆都有範本代碼，id 是品牌加型號', () => {
    for (const s of LABEL_SHEETS) {
      expect(s.template, s.id).toMatch(/^\d{3,4}$/)
      expect(s.id).toBe(`${s.brand}-${s.model}`)
      expect(s.model).toMatch(s.brand === 'longder' ? /^LD-\d+$/ : /^[CL]\d+$/)
    }
  })

  it('龍德的範本編號就是型號的數字', () => {
    for (const s of LABEL_SHEETS.filter(x => x.brand === 'longder')) expect(s.model).toBe(`LD-${s.template}`)
  })
})

describe.each(LABEL_SHEETS.map(s => [s.id, s] as [string, LabelSheet]))('%s', (_id, s) => {
  it('欄列是正整數，尺寸、邊界、間距都不是負的', () => {
    expect(Number.isInteger(s.columns) && s.columns > 0).toBe(true)
    expect(Number.isInteger(s.rows) && s.rows > 0).toBe(true)
    expect(s.labelWidthMm).toBeGreaterThan(0)
    expect(s.labelHeightMm).toBeGreaterThan(0)
    for (const v of [s.topMm, s.leftMm, s.colGapMm, s.rowGapMm]) expect(v).toBeGreaterThanOrEqual(0)
  })

  it('格子加總不超出 A4：每一格都在紙裡', () => {
    expect(gridFitsA4(s)).toBe(true)
    for (let i = 0; i < sheetCells(s); i += 1) {
      const r = cellRect(s, i)
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(A4.widthMm + 1e-6)
      expect(r.y + r.h).toBeLessThanOrEqual(A4.heightMm + 1e-6)
    }
  })

  it('左右對得上紙寬：右邊界（反推）跟左邊界相差 1 mm 以內', () => {
    expect(Math.abs(gridRight(s) - s.leftMm)).toBeLessThanOrEqual(1 + 1e-9)
  })

  it('全版切割就是四邊沒有留白、標籤緊貼著；有留白的就不是全版切割', () => {
    if (s.fullBleed) {
      expect([s.topMm, s.leftMm, s.colGapMm, s.rowGapMm]).toEqual([0, 0, 0, 0])
      expect(gridRight(s)).toBeCloseTo(0, 6)
      expect(gridBottom(s)).toBeLessThanOrEqual(1 + 1e-9)
    } else {
      expect(s.topMm > 0 || s.leftMm > 0).toBe(true)
    }
  })

  it('選單上的名字有型號、格數與寬高', () => {
    const label = sheetLabel(s)
    expect(label.startsWith(`${s.model}：${s.columns * s.rows} 格（${s.columns} × ${s.rows}）`)).toBe(true)
    expect(label).toContain(`寬 ${s.labelWidthMm} × 高 ${s.labelHeightMm} mm`)
    expect(label.includes('全版切割')).toBe(s.fullBleed)
  })
})

describe('下邊界：範本沒有寫，用紙高反推', () => {
  // 297 − 上邊界 − 列數 × 列高 − (列數 − 1) × 列距。資料一改這裡就會紅，要對照範本確認新的下邊界合理。
  const EXPECTED_BOTTOM: Record<string, number> = {
    'herwood-C59105': 0, 'herwood-L5799': 5.5, 'herwood-C37105': 0.2, 'herwood-L3499': 12.3, 'herwood-L4270': 0,
    'herwood-C3770': 0.2, 'herwood-L3464': 12.1, 'herwood-L3270': 4.5, 'herwood-C3070': 0, 'herwood-C2770': 0,
    'herwood-C3053': 0, 'herwood-L2848': 8.5, 'herwood-L2437': 8.7, 'herwood-L1748': 13.3,
    'longder-LD-831': 0, 'longder-LD-814': 5.3, 'longder-LD-801': 1, 'longder-LD-811': 12.1, 'longder-LD-817': 14.4,
    'longder-LD-802': 1, 'longder-LD-818': 12.1, 'longder-LD-8108': 4.5, 'longder-LD-834': 0, 'longder-LD-891': 0,
    'longder-LD-870': 0, 'longder-LD-895': 8, 'longder-LD-853': 8.7, 'longder-LD-849': 13.3, 'longder-LD-8101': 13.3,
  }

  it('每個型號都列在這張表上', () => {
    expect(Object.keys(EXPECTED_BOTTOM).sort()).toEqual(LABEL_SHEETS.map(s => s.id).sort())
  })

  it.each(Object.entries(EXPECTED_BOTTOM))('%s 的下邊界是 %s mm', (id, bottom) => {
    expect(gridBottom(sheetById[id]!)).toBeCloseTo(bottom, 6)
  })

  it('左右對稱、上下也對稱的型號，下邊界等於上邊界（反推的數字可信）', () => {
    for (const id of ['herwood-L3270', 'herwood-L2848', 'herwood-L1748', 'longder-LD-8101', 'longder-LD-849']) {
      const s = sheetById[id]!
      expect(gridBottom(s), id).toBeCloseTo(s.topMm, 6)
    }
  })
})

describe('橫向範本換算成直向', () => {
  // 範本裡的表格（橫向 A4，297 寬 × 210 高）：欄數、列數、欄寬、列高
  const RAW: Record<string, { columns: number; rows: number; width: number; height: number }> = {
    'herwood-C59105': { columns: 5, rows: 2, width: 59.4, height: 105 },
    'herwood-C37105': { columns: 8, rows: 2, width: 37.1, height: 105 },
    'herwood-C3070': { columns: 10, rows: 3, width: 29.7, height: 70 },
  }

  it('有標 landscapeTemplate 的就是這幾個', () => {
    expect(LABEL_SHEETS.filter(s => s.landscapeTemplate).map(s => s.id).sort()).toEqual(Object.keys(RAW).sort())
  })

  it.each(Object.entries(RAW))('%s：欄列與寬高對調之後就是資料裡的直向數字，而且原本的表格放得進橫向 A4', (id, raw) => {
    const s = sheetById[id]!
    expect({ columns: s.columns, rows: s.rows, w: s.labelWidthMm, h: s.labelHeightMm })
      .toEqual({ columns: raw.rows, rows: raw.columns, w: raw.height, h: raw.width })
    expect(raw.columns * raw.width).toBeLessThanOrEqual(A4.heightMm + 1e-6)
    expect(raw.rows * raw.height).toBeLessThanOrEqual(A4.widthMm + 1e-6)
  })
})
