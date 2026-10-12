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

export type LabelBrand = 'herwood' | 'longder'

export const BRAND_NAMES: Record<LabelBrand, string> = { herwood: '鶴屋', longder: '龍德' }

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
