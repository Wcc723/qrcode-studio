import { describe, it, expect } from 'vitest'
import { A4, CELL_PADDING_MM, OFFSET_LIMIT_MM, PRINTER_EDGE_MM } from './paper'
import { LABEL_SHEETS, sheetById, sheetCells, type LabelGrid, type LabelSheet } from './labelSheets'
import {
  LABEL_MAX_COPIES, cellRect, clampOffset, contentBox, customInputFrom, edgeCellCount, gridBottom, gridRight, normalizePlacement,
  parseCustomGrid, placeLabels, sheetCount, slotCount, testPageCells,
} from './labelLayout'

const NO_OFFSET = { xMm: 0, yMm: 0 }
const L3464 = sheetById['herwood-L3464']!
const C3070 = sheetById['herwood-C3070']!
const LD8101 = sheetById['longder-LD-8101']!
const items = (n: number) => Array.from({ length: n }, (_, i) => `#${i + 1}`)

describe('每個型號的格子座標', () => {
  it.each(LABEL_SHEETS.map(s => [s.id, s] as [string, LabelSheet]))('%s：第 1 格在上、左邊界，之後每格往右、往下推一個格距', (_id, s) => {
    for (let i = 0; i < sheetCells(s); i += 1) {
      const row = Math.floor(i / s.columns)
      const column = i % s.columns
      const r = cellRect(s, i)
      expect(r.x).toBeCloseTo(s.leftMm + column * (s.labelWidthMm + s.colGapMm), 6)
      expect(r.y).toBeCloseTo(s.topMm + row * (s.labelHeightMm + s.rowGapMm), 6)
      expect([r.w, r.h]).toEqual([s.labelWidthMm, s.labelHeightMm])
    }
    const last = cellRect(s, sheetCells(s) - 1)
    expect(A4.widthMm - (last.x + last.w)).toBeCloseTo(gridRight(s), 6)
    expect(A4.heightMm - (last.y + last.h)).toBeCloseTo(gridBottom(s), 6)
  })

  it('抽三個型號對照實際數字', () => {
    // 鶴屋 L3464：上 13.7、左 6.3，格 64 × 33.9，欄距 2.7
    expect(cellRect(L3464, 0)).toEqual({ x: 6.3, y: 13.7, w: 64, h: 33.9 })
    expect(cellRect(L3464, 1)).toEqual({ x: 73, y: 13.7, w: 64, h: 33.9 })
    expect(cellRect(L3464, 5)).toEqual({ x: 139.7, y: 47.6, w: 64, h: 33.9 })
    expect(cellRect(L3464, 23)).toEqual({ x: 139.7, y: 251, w: 64, h: 33.9 })
    // 鶴屋 C3070（全版切割，範本是橫向）：3 × 10 格 70 × 29.7，緊貼著排滿整張
    expect(cellRect(C3070, 0)).toEqual({ x: 0, y: 0, w: 70, h: 29.7 })
    expect(cellRect(C3070, 4)).toEqual({ x: 70, y: 29.7, w: 70, h: 29.7 })
    expect(cellRect(C3070, 29)).toEqual({ x: 140, y: 267.3, w: 70, h: 29.7 })
    // 龍德 LD-8101：7 × 16 格 25.4 × 16.9，欄距 2.5
    expect(cellRect(LD8101, 0)).toEqual({ x: 8.6, y: 13.3, w: 25.4, h: 16.9 })
    expect(cellRect(LD8101, 6)).toEqual({ x: 176, y: 13.3, w: 25.4, h: 16.9 })
    expect(cellRect(LD8101, 7)).toEqual({ x: 8.6, y: 30.2, w: 25.4, h: 16.9 })
    expect(cellRect(LD8101, 111)).toEqual({ x: 176, y: 266.8, w: 25.4, h: 16.9 })
  })
})

describe('從第 N 格開始、每筆 N 份、跨頁', () => {
  it('從第 5 格開始：第一張前 4 格留白，第 1 筆在第 5 格', () => {
    const pages = placeLabels(items(3), L3464, { startCell: 5, copies: 1, offset: NO_OFFSET })
    expect(pages).toHaveLength(1)
    expect(pages[0]!.cells.map(c => c.item)).toEqual([null, null, null, null, '#1', '#2', '#3'])
    expect(pages[0]!.cells.map(c => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(pages[0]!.cells[4]!.rect).toEqual(cellRect(L3464, 4))
  })

  it('每筆印 3 份：同一筆連續三格', () => {
    const pages = placeLabels(items(2), L3464, { startCell: 1, copies: 3, offset: NO_OFFSET })
    expect(pages[0]!.cells.map(c => c.item)).toEqual(['#1', '#1', '#1', '#2', '#2', '#2'])
  })

  it('跨頁：排滿一張換下一張，下一張從第 1 格開始（起始格只影響第一張）', () => {
    // L3464 一張 24 格：從第 20 格開始，10 筆 → 第一張 5 筆（第 20 到 24 格），第二張 5 筆（第 1 到 5 格）
    const pages = placeLabels(items(10), L3464, { startCell: 20, copies: 1, offset: NO_OFFSET })
    expect(pages).toHaveLength(2)
    expect(pages[0]!.cells.filter(c => c.item).map(c => [c.index, c.item])).toEqual([[19, '#1'], [20, '#2'], [21, '#3'], [22, '#4'], [23, '#5']])
    expect(pages[1]!.cells.map(c => [c.index, c.item])).toEqual([[0, '#6'], [1, '#7'], [2, '#8'], [3, '#9'], [4, '#10']])
    expect(sheetCount(L3464, 10, { startCell: 20, copies: 1 })).toBe(2)
  })

  it('份數與起始格一起：一筆的幾份可以跨到下一張', () => {
    const pages = placeLabels(items(2), L3464, { startCell: 23, copies: 2, offset: NO_OFFSET })
    expect(pages[0]!.cells.filter(c => c.item).map(c => [c.index, c.item])).toEqual([[22, '#1'], [23, '#1']])
    expect(pages[1]!.cells.map(c => [c.index, c.item])).toEqual([[0, '#2'], [1, '#2']])
  })

  it('剛好排滿時不多一張；多一筆才多一張', () => {
    expect(placeLabels(items(24), L3464, { startCell: 1, copies: 1, offset: NO_OFFSET })).toHaveLength(1)
    expect(placeLabels(items(25), L3464, { startCell: 1, copies: 1, offset: NO_OFFSET })).toHaveLength(2)
    expect(sheetCount(L3464, 24, { startCell: 1, copies: 1 })).toBe(1)
    expect(sheetCount(L3464, 12, { startCell: 1, copies: 2 })).toBe(1)
    expect(sheetCount(L3464, 12, { startCell: 2, copies: 2 })).toBe(2)
    expect(sheetCount(LD8101, 1000, { startCell: 1, copies: 1 })).toBe(9)
  })

  it('沒有任何一筆時不排、不印', () => {
    expect(placeLabels([], L3464, { startCell: 5, copies: 2, offset: NO_OFFSET })).toEqual([])
    expect(slotCount(0, 5, 2)).toBe(0)
    expect(sheetCount(L3464, 0, { startCell: 5, copies: 2 })).toBe(0)
  })

  it('起始格超過一張的格數、份數小於 1、不是數字時，整理成合法的值', () => {
    expect(normalizePlacement(L3464, 99, 1)).toEqual({ startCell: 24, copies: 1 })
    expect(normalizePlacement(L3464, 0, 0)).toEqual({ startCell: 1, copies: 1 })
    expect(normalizePlacement(L3464, Number.NaN, Number.NaN)).toEqual({ startCell: 1, copies: 1 })
    expect(normalizePlacement(L3464, 3.7, 2.9)).toEqual({ startCell: 3, copies: 2 })
    expect(normalizePlacement(L3464, 1, 999)).toEqual({ startCell: 1, copies: LABEL_MAX_COPIES })
  })
})

describe('X／Y 位移', () => {
  it('每一格（含留白的格子）都照位移平移，大小不變', () => {
    const offset = { xMm: 1.5, yMm: -0.8 }
    const pages = placeLabels(items(30), L3464, { startCell: 3, copies: 1, offset })
    for (const page of pages) {
      for (const c of page.cells) {
        const base = cellRect(L3464, c.index)
        expect(c.rect.x).toBeCloseTo(base.x + 1.5, 6)
        expect(c.rect.y).toBeCloseTo(base.y - 0.8, 6)
        expect([c.rect.w, c.rect.h]).toEqual([base.w, base.h])
      }
    }
  })

  it('對位測試頁的格線也跟著位移', () => {
    const cells = testPageCells(C3070, { xMm: -2, yMm: 3 })
    expect(cells).toHaveLength(30)
    expect(cells[0]).toEqual({ x: -2, y: 3, w: 70, h: 29.7 })
    expect(cells[29]).toEqual({ x: 138, y: 270.3, w: 70, h: 29.7 })
  })

  it('位移取到 0.1 mm、限制在 ±10 mm，不是數字就是 0', () => {
    expect(clampOffset(1.234)).toBe(1.2)
    expect(clampOffset(-0.06)).toBe(-0.1)
    expect(clampOffset(-0.04)).toBe(0)
    expect(clampOffset(25)).toBe(OFFSET_LIMIT_MM)
    expect(clampOffset(-25)).toBe(-OFFSET_LIMIT_MM)
    expect(clampOffset('')).toBe(0)
    expect(clampOffset('2.5')).toBe(2.5)
    expect(clampOffset('abc')).toBe(0)
    expect(clampOffset(Number.NaN)).toBe(0)
    expect(clampOffset(undefined)).toBe(0)
    expect(Object.is(clampOffset(-0.01), 0)).toBe(true)
  })
})

describe('可以放東西的範圍：內距與印表機印不到的紙邊', () => {
  it('四周扣掉內距', () => {
    const { box, clipped } = contentBox(cellRect(L3464, 4), true)
    const r = cellRect(L3464, 4)
    expect(box).toEqual({ x: r.x + CELL_PADDING_MM, y: r.y + CELL_PADDING_MM, w: r.w - CELL_PADDING_MM * 2, h: r.h - CELL_PADDING_MM * 2 })
    expect(clipped).toBe(false)
  })

  it('全版切割的四個角落縮進印得到的範圍，中間的格子不受影響', () => {
    const first = contentBox(cellRect(C3070, 0), true)
    expect(first.clipped).toBe(true)
    expect(first.box.x).toBe(PRINTER_EDGE_MM)
    expect(first.box.y).toBe(PRINTER_EDGE_MM)
    expect(first.box.x + first.box.w).toBeCloseTo(70 - CELL_PADDING_MM, 6)
    const last = contentBox(cellRect(C3070, 29), true)
    expect(last.box.x + last.box.w).toBeCloseTo(A4.widthMm - PRINTER_EDGE_MM, 6)
    expect(last.box.y + last.box.h).toBeCloseTo(A4.heightMm - PRINTER_EDGE_MM, 6)
    // 第 2 列中間那一格離紙邊很遠
    expect(contentBox(cellRect(C3070, 4), true).clipped).toBe(false)
    // 關掉就不縮
    expect(contentBox(cellRect(C3070, 0), false)).toEqual({ box: { x: 1.5, y: 1.5, w: 67, h: 26.7 }, clipped: false })
  })

  it('有幾格會碰到紙邊：全版切割 3 × 10 是外圈 22 格，四邊都有留白的型號是 0，位移推出去也會碰到', () => {
    expect(edgeCellCount(C3070, NO_OFFSET)).toBe(22)
    expect(edgeCellCount(L3464, NO_OFFSET)).toBe(0)
    // L3464 左邊界 6.3：往左推 3 mm，第一欄的內容就進到印不到的範圍
    expect(edgeCellCount(L3464, { xMm: -3, yMm: 0 })).toBe(8)
    // 左右貼著紙邊、上下有 4.5 mm 留白：只有第一欄與最後一欄（上下加上內距已經離紙邊 6 mm）
    expect(edgeCellCount(sheetById['herwood-L3270']!, NO_OFFSET)).toBe(2 * 9)
  })

  it('縮到沒有空間時寬或高是 0', () => {
    const { box } = contentBox({ x: 0, y: 0, w: 5, h: 5 }, true)
    expect(box.w).toBe(0)
    expect(box.h).toBe(0)
  })
})

describe('自訂尺寸', () => {
  const ok = { columns: '3', rows: '8', labelWidthMm: '64', labelHeightMm: '33.9', topMm: '13.7', leftMm: '6.3', colGapMm: '2.7', rowGapMm: '0' }

  it('跟型號一樣的數字就排出一樣的格子', () => {
    const r = parseCustomGrid(ok)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    for (let i = 0; i < 24; i += 1) expect(cellRect(r.grid, i)).toEqual(cellRect(L3464, i))
    expect(customInputFrom(L3464)).toEqual(ok)
  })

  it('全形數字、空白、留白的邊界與間距（當 0）也收', () => {
    const r = parseCustomGrid({ ...ok, columns: '３', labelWidthMm: ' 64 ', colGapMm: '', rowGapMm: '' })
    expect(r.ok && r.grid.columns === 3 && r.grid.colGapMm === 0).toBe(true)
  })

  it('欄列不是整數、尺寸太小、不是數字時指出是哪一欄', () => {
    expect(parseCustomGrid({ ...ok, columns: '0' })).toMatchObject({ ok: false, field: 'columns' })
    expect(parseCustomGrid({ ...ok, rows: '2.5' })).toMatchObject({ ok: false, field: 'rows' })
    expect(parseCustomGrid({ ...ok, rows: '41' })).toMatchObject({ ok: false, field: 'rows' })
    expect(parseCustomGrid({ ...ok, labelWidthMm: '5' })).toMatchObject({ ok: false, field: 'labelWidthMm' })
    expect(parseCustomGrid({ ...ok, labelHeightMm: 'abc' })).toMatchObject({ ok: false, field: 'labelHeightMm' })
    expect(parseCustomGrid({ ...ok, topMm: '-1' })).toMatchObject({ ok: false, field: 'topMm' })
  })

  it('格子加總超出 A4 時擋下，說明加起來是多少', () => {
    const wide = parseCustomGrid({ ...ok, labelWidthMm: '70' })
    expect(wide).toMatchObject({ ok: false, field: 'colGapMm' })
    if (!wide.ok) expect(wide.error).toContain('超出 A4 的寬 210 mm')
    const tall = parseCustomGrid({ ...ok, rows: '9' })
    expect(tall).toMatchObject({ ok: false, field: 'labelHeightMm' })
    if (!tall.ok) expect(tall.error).toContain('超出 A4 的高 297 mm')
    // 剛好 210 × 297 可以
    const full: LabelGrid = { columns: 3, rows: 10, labelWidthMm: 70, labelHeightMm: 29.7, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }
    expect(parseCustomGrid(customInputFrom(full)).ok).toBe(true)
  })
})
