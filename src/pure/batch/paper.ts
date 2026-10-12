/**
 * 印成 A4 標籤紙的列印規格：紙張、印表機印不到的紙邊、每格的內距、字級、一維條碼與 QR Code 的最小尺寸、
 * 位移的範圍、校正尺與對位測試頁。
 *
 * 毫米數字只寫在這裡：元件用這裡的常數與 mm() 組 CSS，不寫毫米字面值（src/batch-gates.test.ts 會掃）。
 * 每個標籤紙型號的格子尺寸是資料，放在 labelSheets.ts。
 *
 * 版面用 CSS 的 mm 單位畫在 DOM 上：碼是向量 SVG、文字是系統字型，列印時不截圖、不轉點陣，
 * 也不用 transform 縮放（螢幕預覽的縮放只在 @media screen）。只做瀏覽器列印，不產生 PDF 檔。
 */
import type { BarcodeSymbology } from '../validateBarcode'

export const A4 = { widthMm: 210, heightMm: 297 } as const

/**
 * 列印區顯示時才加進頁面的 @page 規則（離開就拿掉，其他頁照一般網頁列印）：A4、邊界 0。
 * 邊界 0 時瀏覽器沒有空間印頁首頁尾，格子的位置也才會照型號的數字落在紙上。
 */
export const PAGE_RULE = '@page { size: A4; margin: 0; }'

/**
 * 每張紙的元素高度扣掉的安全量。剛好 297 mm 的元素在部分縮放與印表機設定下會被換算得多一點點，
 * 多印出一張只有 0.01 mm 內容的白紙。扣掉的這一點在紙的最下緣，印表機本來就印不到。
 */
export const PAGE_FIT_GUARD_MM = 0.5

/**
 * 多數雷射與噴墨印表機印不到紙邊 PRINTER_EDGE_FROM_MM 到 PRINTER_EDGE_MM（無邊界列印除外）。全版切割或貼著紙邊的型號，
 * 最外圈格子裡的碼與文字自動縮進 PRINTER_EDGE_MM 這條線以內（可以關掉）。
 */
export const PRINTER_EDGE_MM = 5
/** 印不到的紙邊常見的下緣，只用在說明文字；內縮一律照 PRINTER_EDGE_MM */
export const PRINTER_EDGE_FROM_MM = 3
/** 說明文字用的「3 到 5 mm」 */
export const PRINTER_EDGE_RANGE = `${PRINTER_EDGE_FROM_MM} 到 ${PRINTER_EDGE_MM} mm`

/** 每格四周的內距：模切與送紙的誤差，碼與字不貼著標籤的邊 */
export const CELL_PADDING_MM = 1.5

/** 碼與文字、文字與文字之間的間距 */
export const CONTENT_GAP_MM = 1

/** X／Y 位移的上下限與最小單位 */
export const OFFSET_LIMIT_MM = 10
export const OFFSET_STEP_MM = 0.1

/** 自訂尺寸的範圍：格子太小放不下碼，欄列太多也排不進 A4 */
export const CUSTOM_MIN_CELL_MM = 10
export const CUSTOM_MAX_COLUMNS = 20
export const CUSTOM_MAX_ROWS = 40

/* ---------- 文字 ---------- */

/** 標籤上的字最小與最大的字級（pt）；更小的字印出來不好讀 */
export const MIN_LABEL_FONT_PT = 6
export const MAX_LABEL_FONT_PT = 16
/** 條碼下方號碼的字級上限（pt），不讓號碼比條碼還搶眼 */
export const MAX_HRI_FONT_PT = 10
/** 條碼下方號碼的字高大約是幾個窄條寬（照 GS1 的人眼可讀字高約 8 倍窄條） */
export const HRI_HEIGHT_MODULES = 8
/** 行高（倍數），畫面上的 line-height 用同一個數字 */
export const LINE_HEIGHT = 1.2
/**
 * 寬度只用到九成六：canvas 的量測與實際排版可能差一點點（字距、印表機驅動的字型替換），
 * 留一點餘裕，字才不會剛好貼到格子邊或被裁掉。
 */
export const TEXT_WIDTH_SAFETY = 0.96
/** 碼在上、字在下時，文字最多佔可用高度的幾成（小格子裡碼優先） */
export const STACK_TEXT_MAX_SHARE = 0.3
/** QR Code 在左、字在右時，QR Code 最多佔可用寬度的幾成 */
export const SIDE_CODE_MAX_SHARE = 0.6
/**
 * 右邊留給字的寬度至少要這麼寬，QR Code 才放左邊、字放右邊；不到就改成碼在上、字在下。
 * 只看格子的形狀、不看字的長短，同一張紙上每一格的排法才一致。
 */
export const SIDE_MIN_TEXT_MM = 15

/* ---------- 一維條碼與 QR Code 的大小 ---------- */

/**
 * 一維條碼最細那條線（窄條，X 尺寸）的寬度下限：低於這個就擋下，不輸出掃不到的標籤。
 * EAN-13、EAN-8 是標準尺寸 0.33 mm 的 80%（GS1 允許的最小倍率）；Code 128、Code 39 是一般掃描槍
 * 讀得穩的 0.19 mm（7.5 mil）；ITF-14 照最小倍率 0.264 mm 擋下，物流外箱另外提醒。
 */
export const BARCODE_MIN_X_MM: Record<BarcodeSymbology, number> = {
  ean13: 0.264, ean8: 0.264, code128: 0.19, code39: 0.19, itf14: 0.264,
}
/** 低於這個寬度只提醒：Code 128、Code 39 建議 0.25 mm（10 mil）以上；ITF-14 物流外箱建議 0.495 mm 以上 */
export const BARCODE_WARN_X_MM: Partial<Record<BarcodeSymbology, number>> = {
  code128: 0.25, code39: 0.25, itf14: 0.495,
}
/** 窄條寬度的上限：EAN 是標準尺寸的 200%，ITF-14 是標準尺寸；大格子裡不把條碼放得過大 */
export const BARCODE_MAX_X_MM: Record<BarcodeSymbology, number> = {
  ean13: 0.66, ean8: 0.66, code128: 0.5, code39: 0.5, itf14: 1.016,
}
/** 條高的下限：太矮的條碼掃描時要對得很準 */
export const BARCODE_MIN_BAR_HEIGHT_MM = 5
/** 條高最多是條碼寬度的幾成（EAN-13 標準尺寸的條高約是寬度的六成） */
export const BARCODE_MAX_HEIGHT_RATIO = 0.6

/** QR Code 每個小方塊（模組）的寬度：低於下限擋下，低於建議值提醒手機要靠近 */
export const QR_MIN_MODULE_MM = 0.2
export const QR_WARN_MODULE_MM = 0.3

/* ---------- 校正尺與對位測試頁 ---------- */

/** 校正尺的長度：印出來量得剛好 5 公分，就是用實際大小（100%）列印 */
export const CALIBRATION_MM = 50
/** 尺身（刻度）的高度，數字另外再往下 */
export const CALIBRATION_HEIGHT_MM = 6
/** 尺的數字字高 */
export const CALIBRATION_LABEL_MM = 2.2
/** 尺的線寬：底線與刻度 */
export const CALIBRATION_LINE_MM = 0.2
export const CALIBRATION_TICK_LINE_MM = 0.15

/** 對位測試頁的格線寬度與格號字級（pt） */
export const TEST_LINE_MM = 0.2
export const TEST_NUMBER_PT = 9
/** 測試頁中間那塊說明（校正尺加兩行字）的寬、高與內距 */
export const TEST_INFO_WIDTH_MM = 120
export const TEST_INFO_HEIGHT_MM = 30
export const TEST_INFO_PADDING_MM = 3
/** 說明的字級（pt） */
export const TEST_INFO_FONT_PT = 8

/** 螢幕預覽上「第幾頁」小字的位置（離紙的右下角） */
export const PAGE_NUMBER_INSET_MM = 2

/* ---------- 單位換算 ---------- */

/** 1pt = 25.4 / 72 mm */
export const MM_PER_PT = 25.4 / 72
/** CSS 的 1mm 是 96 / 25.4 px */
export const PX_PER_MM = 96 / 25.4

export function ptToMm(pt: number): number {
  return pt * MM_PER_PT
}

export function mmToPt(value: number): number {
  return value / MM_PER_PT
}

/** CSS 用的毫米字串，四捨五入到 0.001 mm，避免 0.30000000000000004mm 這種值 */
export function mm(value: number): string {
  return `${Math.round(value * 1000) / 1000}mm`
}

/** CSS 用的 pt 字串 */
export function pt(value: number): string {
  return `${Math.round(value * 100) / 100}pt`
}

/** 一張紙的元素尺寸（CSS），已扣掉 PAGE_FIT_GUARD_MM */
export function sheetBox(): { width: string; height: string } {
  return { width: mm(A4.widthMm), height: mm(A4.heightMm - PAGE_FIT_GUARD_MM) }
}
