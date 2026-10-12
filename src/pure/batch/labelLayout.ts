/**
 * 標籤紙的排版（純函式）：每一格在 A4 上的位置、從第 N 格開始、每筆印 N 份、跨頁、X／Y 位移，
 * 以及格子裡可以放碼與字的範圍（內距、避開印表機印不到的紙邊）。
 *
 * 座標原點是紙的左上角，單位 mm，格子依列優先編號（先排滿第一列，再換下一列），跟拿著標籤紙看的順序一樣。
 * 格子是「依型號的絕對位置」定位，不是把格子平均排滿整張紙：同格數的兩個型號，邊界不同就印在不同的地方。
 *
 *     const pages = placeLabels(items, sheet, { startCell: 5, copies: 2, offset: { xMm: 0.5, yMm: -1 } })
 *     pages[0].cells[0]   // { index: 0, rect: {…}, item: null }：第 1 到 4 格留白
 */
import { A4, CELL_PADDING_MM, CUSTOM_MAX_COLUMNS, CUSTOM_MAX_ROWS, CUSTOM_MIN_CELL_MM, OFFSET_LIMIT_MM, OFFSET_STEP_MM, PRINTER_EDGE_MM } from './paper'
import { sheetCells, type LabelGrid } from './labelSheets'

export interface Rect { x: number; y: number; w: number; h: number }
export interface Offset { xMm: number; yMm: number }

/** 浮點數的容許誤差：4.7 + 2 × 101.6 這種加法不一定剛好 */
const EPS = 1e-6
const round3 = (n: number) => Math.round(n * 1000) / 1000

/** 第 index 格（0 起算，列優先）在紙上的位置，還沒加位移 */
export function cellRect(g: LabelGrid, index: number): Rect {
  const column = index % g.columns
  const row = Math.floor(index / g.columns)
  return {
    x: round3(g.leftMm + column * (g.labelWidthMm + g.colGapMm)),
    y: round3(g.topMm + row * (g.labelHeightMm + g.rowGapMm)),
    w: g.labelWidthMm,
    h: g.labelHeightMm,
  }
}

/** 整組格子的寬與高 */
export function gridWidth(g: LabelGrid): number {
  return g.columns * g.labelWidthMm + (g.columns - 1) * g.colGapMm
}
export function gridHeight(g: LabelGrid): number {
  return g.rows * g.labelHeightMm + (g.rows - 1) * g.rowGapMm
}

/** 右邊界與下邊界：資料裡沒有，用紙的寬高反推 */
export function gridRight(g: LabelGrid): number {
  return round3(A4.widthMm - g.leftMm - gridWidth(g))
}
export function gridBottom(g: LabelGrid): number {
  return round3(A4.heightMm - g.topMm - gridHeight(g))
}

/** 整組格子都在 A4 裡面 */
export function gridFitsA4(g: LabelGrid): boolean {
  return g.leftMm >= 0 && g.topMm >= 0 && gridRight(g) >= -EPS && gridBottom(g) >= -EPS
}

/* ---------- 位移 ---------- */

/** 位移取到 OFFSET_STEP_MM、限制在 ±OFFSET_LIMIT_MM；不是數字（空白、NaN）就是 0 */
export function clampOffset(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  if (!Number.isFinite(n)) return 0
  const stepped = Math.round(n / OFFSET_STEP_MM) * OFFSET_STEP_MM
  const clamped = Math.min(OFFSET_LIMIT_MM, Math.max(-OFFSET_LIMIT_MM, stepped))
  return Math.round(clamped * 10) / 10 || 0
}

export function shiftRect(r: Rect, offset: Offset): Rect {
  return { x: round3(r.x + offset.xMm), y: round3(r.y + offset.yMm), w: r.w, h: r.h }
}

/* ---------- 從第 N 格開始、每筆 N 份、跨頁 ---------- */

/**
 * 一次最多排幾格（含「從第 N 格開始」前面留白的格子與每筆的份數）。每一格都是 DOM 裡的一個向量碼加幾行字，
 * 列印時瀏覽器要一次排好全部的頁面；超過就請使用者分批印。
 */
export const LABEL_MAX_CELLS = 2000
/** 每筆最多印幾份 */
export const LABEL_MAX_COPIES = 20

export interface PlacementOptions {
  /** 從第幾格開始印（1 起算）；前面的格子留白，只影響第一張 */
  startCell: number
  /** 每一筆連續印幾份 */
  copies: number
  offset: Offset
}

export interface PlacedCell<T> {
  /** 在這張紙上是第幾格（0 起算） */
  index: number
  /** 加過位移的位置 */
  rect: Rect
  /** 這一格印哪一筆；null 是「從第 N 格開始」前面留白的格子 */
  item: T | null
}

export interface LabelPage<T> {
  cells: PlacedCell<T>[]
}

/** 起始格與份數整理成合法的整數：起始格 1 到一張的格數，份數 1 到 LABEL_MAX_COPIES */
export function normalizePlacement(g: LabelGrid, startCell: number, copies: number): { startCell: number; copies: number } {
  const per = sheetCells(g)
  const start = Number.isFinite(startCell) ? Math.min(per, Math.max(1, Math.floor(startCell))) : 1
  const n = Number.isFinite(copies) ? Math.min(LABEL_MAX_COPIES, Math.max(1, Math.floor(copies))) : 1
  return { startCell: start, copies: n }
}

/** 一共要用到幾格（含前面留白的格子） */
export function slotCount(itemCount: number, startCell: number, copies: number): number {
  return itemCount ? startCell - 1 + itemCount * copies : 0
}

/** 要印幾張 A4 */
export function sheetCount(g: LabelGrid, itemCount: number, opts: Pick<PlacementOptions, 'startCell' | 'copies'>): number {
  const { startCell, copies } = normalizePlacement(g, opts.startCell, opts.copies)
  return Math.ceil(slotCount(itemCount, startCell, copies) / sheetCells(g))
}

/**
 * 把每一筆排進格子：前面 startCell - 1 格留白，每一筆連續 copies 份，一張排滿就換下一張（下一張從第 1 格開始）。
 * 最後一張沒排滿的格子不列出來。沒有任何一筆時回空陣列。
 */
export function placeLabels<T>(items: readonly T[], g: LabelGrid, opts: PlacementOptions): LabelPage<T>[] {
  if (!items.length) return []
  const { startCell, copies } = normalizePlacement(g, opts.startCell, opts.copies)
  const per = sheetCells(g)
  const rects = Array.from({ length: per }, (_, i) => shiftRect(cellRect(g, i), opts.offset))
  const total = slotCount(items.length, startCell, copies)
  const pages: LabelPage<T>[] = []
  for (let slot = 0; slot < total; slot += 1) {
    const index = slot % per
    if (index === 0) pages.push({ cells: [] })
    const itemIndex = slot - (startCell - 1)
    const item = itemIndex < 0 ? null : items[Math.floor(itemIndex / copies)]!
    pages[pages.length - 1]!.cells.push({ index, rect: rects[index]!, item })
  }
  return pages
}

/** 對位測試頁：一張紙的每一格（加過位移），只畫格線與格號 */
export function testPageCells(g: LabelGrid, offset: Offset): Rect[] {
  return Array.from({ length: sheetCells(g) }, (_, i) => shiftRect(cellRect(g, i), offset))
}

/* ---------- 格子裡可以放東西的範圍 ---------- */

export interface ContentBox {
  /** 紙上的位置 */
  box: Rect
  /** 被紙邊（印表機印不到的範圍）縮過 */
  clipped: boolean
}

/**
 * 格子扣掉四周的內距，就是碼與字可以放的範圍。`avoidEdge` 時再跟「印表機印得到的範圍」（紙邊往內 PRINTER_EDGE_MM）
 * 取交集：全版切割或貼著紙邊的型號，最外圈的格子會被縮小，碼與字不會被印表機切掉。
 * 縮完沒有空間時寬或高是 0。
 */
export function contentBox(rect: Rect, avoidEdge: boolean): ContentBox {
  let left = rect.x + CELL_PADDING_MM
  let top = rect.y + CELL_PADDING_MM
  let right = rect.x + rect.w - CELL_PADDING_MM
  let bottom = rect.y + rect.h - CELL_PADDING_MM
  let clipped = false
  if (avoidEdge) {
    const edge = { left: PRINTER_EDGE_MM, top: PRINTER_EDGE_MM, right: A4.widthMm - PRINTER_EDGE_MM, bottom: A4.heightMm - PRINTER_EDGE_MM }
    if (left < edge.left - EPS) { left = edge.left; clipped = true }
    if (top < edge.top - EPS) { top = edge.top; clipped = true }
    if (right > edge.right + EPS) { right = edge.right; clipped = true }
    if (bottom > edge.bottom + EPS) { bottom = edge.bottom; clipped = true }
  }
  return {
    box: { x: round3(left), y: round3(top), w: round3(Math.max(0, right - left)), h: round3(Math.max(0, bottom - top)) },
    clipped,
  }
}

/** 有幾格的內容會碰到印表機印不到的紙邊（不內縮的話）；0 表示這個型號不用擔心 */
export function edgeCellCount(g: LabelGrid, offset: Offset): number {
  return testPageCells(g, offset).filter(r => contentBox(r, true).clipped).length
}

/* ---------- 自訂尺寸 ---------- */

export interface CustomGridInput {
  columns: string
  rows: string
  labelWidthMm: string
  labelHeightMm: string
  topMm: string
  leftMm: string
  colGapMm: string
  rowGapMm: string
}
export type CustomGridField = keyof CustomGridInput

export type CustomGridResult =
  | { ok: true; grid: LabelGrid }
  | { ok: false; field: CustomGridField; error: string }

/** 全形數字與小數點轉半形，去掉頭尾空白 */
function toAscii(s: string): string {
  return s.trim().replace(/[０-９．]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
}

const NUMBER = /^\d+(?:\.\d+)?$/
const INTEGER = /^\d+$/

/** 自訂尺寸的欄位轉成格子；欄位不合理或排不進 A4 時回傳是哪一欄、錯在哪裡 */
export function parseCustomGrid(input: CustomGridInput): CustomGridResult {
  const fail = (field: CustomGridField, error: string): CustomGridResult => ({ ok: false, field, error })
  const ints: [CustomGridField, string, number][] = [['columns', '欄數', CUSTOM_MAX_COLUMNS], ['rows', '列數', CUSTOM_MAX_ROWS]]
  const values: Partial<Record<CustomGridField, number>> = {}
  for (const [field, name, max] of ints) {
    const raw = toAscii(input[field])
    if (!INTEGER.test(raw) || Number(raw) < 1 || Number(raw) > max) return fail(field, `${name}請填 1 到 ${max} 的整數。`)
    values[field] = Number(raw)
  }
  const sizes: [CustomGridField, string][] = [['labelWidthMm', '單格寬'], ['labelHeightMm', '單格高']]
  for (const [field, name] of sizes) {
    const raw = toAscii(input[field])
    if (!NUMBER.test(raw) || Number(raw) < CUSTOM_MIN_CELL_MM) return fail(field, `${name}請填 ${CUSTOM_MIN_CELL_MM} 以上的數字（mm）。`)
    values[field] = Number(raw)
  }
  const gaps: [CustomGridField, string][] = [['topMm', '上邊界'], ['leftMm', '左邊界'], ['colGapMm', '欄距'], ['rowGapMm', '列距']]
  for (const [field, name] of gaps) {
    const raw = toAscii(input[field]) || '0'
    if (!NUMBER.test(raw)) return fail(field, `${name}請填 0 以上的數字（mm）。`)
    values[field] = Number(raw)
  }
  const grid = values as unknown as LabelGrid
  const right = gridRight(grid)
  if (right < -EPS) {
    const total = round3(grid.leftMm + gridWidth(grid))
    return fail(grid.colGapMm > 0 ? 'colGapMm' : 'labelWidthMm', `左邊界加上 ${grid.columns} 欄的寬度共 ${total} mm，超出 A4 的寬 ${A4.widthMm} mm。`)
  }
  const bottom = gridBottom(grid)
  if (bottom < -EPS) {
    const total = round3(grid.topMm + gridHeight(grid))
    return fail(grid.rowGapMm > 0 ? 'rowGapMm' : 'labelHeightMm', `上邊界加上 ${grid.rows} 列的高度共 ${total} mm，超出 A4 的高 ${A4.heightMm} mm。`)
  }
  return { ok: true, grid }
}

/** 把一個型號的數字填進自訂尺寸的欄位（選「自訂」時從目前的型號開始改） */
export function customInputFrom(g: LabelGrid): CustomGridInput {
  return {
    columns: String(g.columns),
    rows: String(g.rows),
    labelWidthMm: String(g.labelWidthMm),
    labelHeightMm: String(g.labelHeightMm),
    topMm: String(g.topMm),
    leftMm: String(g.leftMm),
    colGapMm: String(g.colGapMm),
    rowGapMm: String(g.rowGapMm),
  }
}
