/**
 * 台灣常見的 A4 標籤紙型號（鶴屋、龍德）。純資料，每一筆都是直向 A4 上的位置，單位 mm。
 *
 * 數字來源：兩家官網提供的 Word 範本的版面設定（表格的欄寬、列高與頁面邊界），四捨五入到 0.1 mm，
 * 不是拿尺量的。同格數、同尺寸的型號邊界可能差到 2 mm，所以一律做到「品牌＋型號」，不只用格數。
 * 印出來差一點點時，用畫面上的 X／Y 位移微調。
 *
 * - `template`：範本代碼。鶴屋是官網下載區的範本編號，龍德的範本編號就是型號的數字。
 * - 下邊界與右邊界沒有寫在資料裡，用紙的寬高反推（labelLayout.ts 的 gridRight、gridBottom），
 *   測試逐筆檢查：格子加總不超出 A4、左右邊界對得上紙寬、下邊界跟反推的數字一致。
 * - `landscapeTemplate`：範本本身是橫向 A4 的表格（例如鶴屋 C59105 在範本裡是 5 欄 59.4 × 2 列 105），
 *   這裡已經換算成直向（2 欄 105 × 5 列 59.4）。這幾個都是全版切割、四邊 0，換算不影響邊界。
 * - 範本裡沒有間隔欄、欄寬就是「格距」（標籤加間隙）的型號，標籤寬度從左右對稱的邊界與型號名稱的尺寸推回來，
 *   例如龍德 LD-8101 欄寬 27.9、標籤 25.4，欄距就是 2.5。
 * - `fullBleed`：全版切割，整張紙都是標籤、四邊沒有留白。多數印表機印不到紙邊 3 到 5 mm，
 *   最外圈的格子要內縮（見 paper.ts 的 PRINTER_EDGE_MM）。
 */

import type { PaperId } from './paper'

export type LabelBrand = 'herwood' | 'longder' | 'avery' | 'a4'

/** 繁中選單上的品牌名（英文版的分組名在 copy.ts） */
export const BRAND_NAMES: Record<LabelBrand, string> = { herwood: '鶴屋', longder: '龍德', avery: 'Avery', a4: 'A4' }

export interface LabelGrid {
  columns: number
  rows: number
  /** 單格（一張標籤）的寬與高 */
  labelWidthMm: number
  labelHeightMm: number
  /** 紙的上緣到第一列標籤、左緣到第一欄標籤 */
  topMm: number
  leftMm: number
  /** 相鄰兩欄、兩列標籤之間的空隙（0 表示標籤緊貼著，共用一條切線） */
  colGapMm: number
  rowGapMm: number
}

export interface LabelSheet extends LabelGrid {
  id: string
  brand: LabelBrand
  model: string
  fullBleed: boolean
  template: string
  landscapeTemplate?: true
  /** 紙張；沒寫就是 A4（台灣的型號都是 A4） */
  paper?: PaperId
  /** 英文選單上的標籤尺寸（寬 × 高，照包裝上的寫法），英文版的型號才有 */
  nominal?: string
  /** 英文選單上的常見用途，英文版的型號才有 */
  use?: string
}

const sheet = (s: LabelSheet): LabelSheet => s

export const LABEL_SHEETS: readonly LabelSheet[] = [
  /* ---------- 鶴屋 ---------- */
  sheet({ id: 'herwood-C59105', brand: 'herwood', model: 'C59105', template: '013', landscapeTemplate: true, fullBleed: true, columns: 2, rows: 5, labelWidthMm: 105, labelHeightMm: 59.4, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-L5799', brand: 'herwood', model: 'L5799', template: '042', fullBleed: false, columns: 2, rows: 5, labelWidthMm: 99, labelHeightMm: 57, topMm: 6.5, leftMm: 4.7, colGapMm: 2.6, rowGapMm: 0 }),
  sheet({ id: 'herwood-C37105', brand: 'herwood', model: 'C37105', template: '004', landscapeTemplate: true, fullBleed: true, columns: 2, rows: 8, labelWidthMm: 105, labelHeightMm: 37.1, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-L3499', brand: 'herwood', model: 'L3499', template: '043', fullBleed: false, columns: 2, rows: 8, labelWidthMm: 99, labelHeightMm: 33.9, topMm: 13.5, leftMm: 4.7, colGapMm: 2.6, rowGapMm: 0 }),
  sheet({ id: 'herwood-L4270', brand: 'herwood', model: 'L4270', template: '057', fullBleed: false, columns: 3, rows: 7, labelWidthMm: 70, labelHeightMm: 42, topMm: 3, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-C3770', brand: 'herwood', model: 'C3770', template: '006', fullBleed: true, columns: 3, rows: 8, labelWidthMm: 70, labelHeightMm: 37.1, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-L3464', brand: 'herwood', model: 'L3464', template: '044', fullBleed: false, columns: 3, rows: 8, labelWidthMm: 64, labelHeightMm: 33.9, topMm: 13.7, leftMm: 6.3, colGapMm: 2.7, rowGapMm: 0 }),
  sheet({ id: 'herwood-L3270', brand: 'herwood', model: 'L3270', template: '059', fullBleed: false, columns: 3, rows: 9, labelWidthMm: 70, labelHeightMm: 32, topMm: 4.5, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-C3070', brand: 'herwood', model: 'C3070', template: '007', landscapeTemplate: true, fullBleed: true, columns: 3, rows: 10, labelWidthMm: 70, labelHeightMm: 29.7, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-C2770', brand: 'herwood', model: 'C2770', template: '061', fullBleed: true, columns: 3, rows: 11, labelWidthMm: 70, labelHeightMm: 27, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-C3053', brand: 'herwood', model: 'C3053', template: '052', fullBleed: true, columns: 4, rows: 10, labelWidthMm: 52.5, labelHeightMm: 29.7, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'herwood-L2848', brand: 'herwood', model: 'L2848', template: '100', fullBleed: false, columns: 4, rows: 10, labelWidthMm: 48, labelHeightMm: 28, topMm: 8.5, leftMm: 9, colGapMm: 0, rowGapMm: 0 }),
  // 範本的格距是 39.3 × 25.4，標籤是型號名稱的 37 × 24（高 24、寬 37）
  sheet({ id: 'herwood-L2437', brand: 'herwood', model: 'L2437', template: '050', fullBleed: false, columns: 5, rows: 11, labelWidthMm: 37, labelHeightMm: 24, topMm: 10.3, leftMm: 8, colGapMm: 2.3, rowGapMm: 1.4 }),
  sheet({ id: 'herwood-L1748', brand: 'herwood', model: 'L1748', template: '049', fullBleed: false, columns: 4, rows: 16, labelWidthMm: 48.3, labelHeightMm: 16.9, topMm: 13.3, leftMm: 8.4, colGapMm: 0, rowGapMm: 0 }),

  /* ---------- 龍德 ---------- */
  sheet({ id: 'longder-LD-831', brand: 'longder', model: 'LD-831', template: '831', fullBleed: true, columns: 2, rows: 5, labelWidthMm: 105, labelHeightMm: 59.4, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-814', brand: 'longder', model: 'LD-814', template: '814', fullBleed: false, columns: 2, rows: 5, labelWidthMm: 99.1, labelHeightMm: 57, topMm: 6.7, leftMm: 4.7, colGapMm: 2.5, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-801', brand: 'longder', model: 'LD-801', template: '801', fullBleed: true, columns: 2, rows: 8, labelWidthMm: 105, labelHeightMm: 37, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-811', brand: 'longder', model: 'LD-811', template: '811', fullBleed: false, columns: 2, rows: 8, labelWidthMm: 99.1, labelHeightMm: 33.9, topMm: 13.7, leftMm: 4.7, colGapMm: 2.5, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-817', brand: 'longder', model: 'LD-817', template: '817', fullBleed: false, columns: 3, rows: 7, labelWidthMm: 63.5, labelHeightMm: 38.1, topMm: 15.9, leftMm: 7.2, colGapMm: 2.5, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-802', brand: 'longder', model: 'LD-802', template: '802', fullBleed: true, columns: 3, rows: 8, labelWidthMm: 70, labelHeightMm: 37, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-818', brand: 'longder', model: 'LD-818', template: '818', fullBleed: false, columns: 3, rows: 8, labelWidthMm: 64, labelHeightMm: 33.9, topMm: 13.7, leftMm: 6.4, colGapMm: 2.7, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-8108', brand: 'longder', model: 'LD-8108', template: '8108', fullBleed: false, columns: 3, rows: 9, labelWidthMm: 70, labelHeightMm: 32, topMm: 4.5, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-834', brand: 'longder', model: 'LD-834', template: '834', fullBleed: true, columns: 3, rows: 10, labelWidthMm: 70, labelHeightMm: 29.7, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-891', brand: 'longder', model: 'LD-891', template: '891', fullBleed: true, columns: 3, rows: 11, labelWidthMm: 70, labelHeightMm: 27, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-870', brand: 'longder', model: 'LD-870', template: '870', fullBleed: true, columns: 4, rows: 10, labelWidthMm: 52.5, labelHeightMm: 29.7, topMm: 0, leftMm: 0, colGapMm: 0, rowGapMm: 0 }),
  sheet({ id: 'longder-LD-895', brand: 'longder', model: 'LD-895', template: '895', fullBleed: false, columns: 4, rows: 10, labelWidthMm: 48, labelHeightMm: 28, topMm: 9, leftMm: 8.5, colGapMm: 0, rowGapMm: 0 }),
  // 跟鶴屋 L2437 同一個版面
  sheet({ id: 'longder-LD-853', brand: 'longder', model: 'LD-853', template: '853', fullBleed: false, columns: 5, rows: 11, labelWidthMm: 37, labelHeightMm: 24, topMm: 10.3, leftMm: 8, colGapMm: 2.3, rowGapMm: 1.4 }),
  sheet({ id: 'longder-LD-849', brand: 'longder', model: 'LD-849', template: '849', fullBleed: false, columns: 4, rows: 16, labelWidthMm: 48.3, labelHeightMm: 16.9, topMm: 13.3, leftMm: 8.4, colGapMm: 0, rowGapMm: 0 }),
  // 範本的格距是 27.9，標籤寬 25.4（商品名稱的尺寸）
  sheet({ id: 'longder-LD-8101', brand: 'longder', model: 'LD-8101', template: '8101', fullBleed: false, columns: 7, rows: 16, labelWidthMm: 25.4, labelHeightMm: 16.9, topMm: 13.3, leftMm: 8.6, colGapMm: 2.5, rowGapMm: 0 }),
]

/* ---------- 英文版：美國的 Letter 標籤紙（跟 Avery 型號同規格）與一個 A4 型號 ---------- */

/** PDF 的點（1/72 in）換成 mm，四捨五入到 0.001 mm（先乘成整數再除，13.5 點才會是 4.763 而不是浮點誤差的 4.762） */
const fromPt = (n: number) => Math.round((n * 25400) / 72) / 1000

/**
 * 英文版的型號。Letter 的四個照 Avery 官網範本頁（avery.com/templates/<型號>）提供下載的官方 PDF 範本量：
 * 每一格標籤外框在頁面上的絕對座標（單位是點，1/72 in），再跟同一頁的 Word 範本的欄寬、欄距、列高對過
 * （相差都在 0.05 點以內）。`template` 是 Avery 下載檔的編號。
 *
 * - 5160：Word 與 PDF 範本的標籤寬都是 2.63 in（包裝上寫 2⅝ in），欄距 0.12 in，欄與欄的間隔照樣是 2.75 in。
 * - 5163：左邊界 11.2 點（右邊界 11.25 點），欄距 13.55 點；Word 範本的欄距是 0.1875 in（13.5 點）。
 * - 22806：上下左右與欄距都是 0.625 in，列距 42 點（7/12 in）。
 * - A4 21 格（63.5 × 38.1 mm，3 × 7）：跟英國常見的 21 格標籤同一個尺寸，位置用龍德 LD-817 的 Word 範本。
 *   不同品牌同尺寸的 A4 標籤，邊界可能差一兩 mm，所以畫面上提醒先印對位測試頁。
 *
 * 本站跟 Avery 沒有合作關係，型號只用來說明「跟哪一款標籤紙同規格」。
 */
export const US_LABEL_SHEETS: readonly LabelSheet[] = [
  sheet({ id: 'avery-5160', brand: 'avery', model: '5160', template: 'U-0087-01', paper: 'letter', nominal: '2⅝ × 1 in', use: 'address labels', fullBleed: false, columns: 3, rows: 10, labelWidthMm: fromPt(189.36), labelHeightMm: fromPt(72), topMm: fromPt(36), leftMm: fromPt(13.5), colGapMm: fromPt(8.64), rowGapMm: 0 }),
  sheet({ id: 'avery-5163', brand: 'avery', model: '5163', template: 'U-0090-01', paper: 'letter', nominal: '4 × 2 in', use: 'shipping labels', fullBleed: false, columns: 2, rows: 5, labelWidthMm: fromPt(288), labelHeightMm: fromPt(144), topMm: fromPt(36), leftMm: fromPt(11.2), colGapMm: fromPt(13.55), rowGapMm: 0 }),
  sheet({ id: 'avery-5167', brand: 'avery', model: '5167', template: 'U-0093-01', paper: 'letter', nominal: '1¾ × ½ in', use: 'return address labels', fullBleed: false, columns: 4, rows: 20, labelWidthMm: fromPt(126), labelHeightMm: fromPt(36), topMm: fromPt(36), leftMm: fromPt(21.6), colGapMm: fromPt(21.6), rowGapMm: 0 }),
  sheet({ id: 'avery-22806', brand: 'avery', model: '22806', template: 'U-0431-01', paper: 'letter', nominal: '2 × 2 in', use: 'square labels', fullBleed: false, columns: 3, rows: 4, labelWidthMm: fromPt(144), labelHeightMm: fromPt(144), topMm: fromPt(45), leftMm: fromPt(45), colGapMm: fromPt(45), rowGapMm: fromPt(42) }),
  sheet({ id: 'a4-3x7', brand: 'a4', model: 'A4 21', template: '817', paper: 'a4', nominal: '63.5 × 38.1 mm (2½ × 1½ in)', fullBleed: false, columns: 3, rows: 7, labelWidthMm: 63.5, labelHeightMm: 38.1, topMm: 15.9, leftMm: 7.2, colGapMm: 2.5, rowGapMm: 0 }),
]

/** 英文版預設選的型號：最常見的 30 格地址標籤，QR Code 加一兩行字剛好 */
export const US_DEFAULT_SHEET_ID = 'avery-5160'

export const usSheetById: Readonly<Record<string, LabelSheet>> = Object.fromEntries(US_LABEL_SHEETS.map(s => [s.id, s]))

/** 預設選的型號：四邊都有留白、格子夠放碼加兩三行字的常見辦公標籤 */
export const DEFAULT_SHEET_ID = 'herwood-L3464'

export const sheetById: Readonly<Record<string, LabelSheet>> = Object.fromEntries(LABEL_SHEETS.map(s => [s.id, s]))

/** 一張紙幾格 */
export function sheetCells(g: Pick<LabelGrid, 'columns' | 'rows'>): number {
  return g.columns * g.rows
}

/** 選單上的名字，例如「L3464：24 格（3 × 8），寬 64 × 高 33.9 mm」；全版切割的加註 */
export function sheetLabel(s: LabelSheet): string {
  const size = `寬 ${s.labelWidthMm} × 高 ${s.labelHeightMm} mm`
  return `${s.model}：${sheetCells(s)} 格（${s.columns} × ${s.rows}），${size}${s.fullBleed ? '，全版切割' : ''}`
}

/**
 * 英文選單上的名字：Avery 同規格的寫型號，例如「5160: 30 per sheet (3 × 10), 2⅝ × 1 in, address labels」；
 * A4 的只寫格數與尺寸（分組名已經是 A4）
 */
export function sheetLabelEn(s: LabelSheet): string {
  const size = s.nominal ?? `${s.labelWidthMm} × ${s.labelHeightMm} mm`
  const head = s.brand === 'avery' ? `${s.model}: ` : ''
  return `${head}${sheetCells(s)} per sheet (${s.columns} × ${s.rows}), ${size}${s.use ? `, ${s.use}` : ''}${s.fullBleed ? ', edge to edge' : ''}`
}
