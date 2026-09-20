/**
 * 圖片解碼支援的格式 allowlist。零依賴純函式，刻意不 import zxing-wasm：
 * 這份會被 BarcodeTool 之類的既有頁面引用，import 解碼器會把 reader 拖進錯誤的 chunk。
 * 格式名稱是字面字串，正確性由 scanFormats.test.ts 對套件 export 的 `barcodeFormats` 對帳。
 *
 * 支援範圍固定為站內產生器做得出來的 6 種：QR Code ＋ 5 種一維碼。
 * 其餘符號學（DataMatrix、Aztec、PDF417、UPC-E…）一律回 null，不猜也不降級顯示。
 */
import type { BarcodeSymbology } from './validateBarcode'

export type ScanFormat = 'qrcode' | 'code128' | 'ean13' | 'ean8' | 'code39' | 'itf14'

export const SCAN_FORMATS = ['qrcode', 'code128', 'ean13', 'ean8', 'code39', 'itf14'] as const

/**
 * 傳給 `readBarcodes({ formats })` 的 zxing-wasm v3 正式名稱。
 * 限定 formats 有實際過濾效果：不在清單內的符號學會直接回空陣列（實測 DataMatrix／Aztec／Code 93）。
 */
export const READER_FORMATS = ['QRCode', 'Code128', 'EAN13', 'EAN8', 'Code39', 'ITF14'] as const

const LABELS: Record<ScanFormat, string> = {
  qrcode: 'QR Code',
  code128: 'Code 128',
  ean13: 'EAN-13',
  ean8: 'EAN-8',
  code39: 'Code 39',
  itf14: 'ITF-14',
}

// zxing 會回傳子格式名稱，同一個符號學有多個可能值。
const DIRECT: Record<string, ScanFormat> = {
  QRCode: 'qrcode',
  Code128: 'code128',
  EAN13: 'ean13',
  EAN8: 'ean8',
  Code39: 'code39',
  Code39Std: 'code39',
  Code39Ext: 'code39',
}

/**
 * ITF 的例外：zxing 對 ITF-14 的圖回傳的 format 是 `ITF`，對 10 位 ITF 也是 `ITF`，
 * 光看 format 名會把任意長度的 ITF 誤標成 ITF-14。本站只支援 ITF-14，所以再驗一次位數。
 */
function isItf14Text(text: string): boolean {
  return /^\d{14}$/.test(text)
}

export function toScanFormat(zxingFormat: string, text: string): ScanFormat | null {
  if (zxingFormat === 'ITF' || zxingFormat === 'ITF14') {
    return isItf14Text(text) ? 'itf14' : null
  }
  return DIRECT[zxingFormat] ?? null
}

export function scanFormatLabel(format: ScanFormat): string {
  return LABELS[format]
}

export function isLinearScanFormat(format: ScanFormat): boolean {
  return format !== 'qrcode'
}

/** 一維碼的 id 與站內 BarcodeSymbology 同名，直接做為「重新產生」的交棒目標。 */
export function scanFormatToSymbology(format: ScanFormat): BarcodeSymbology | null {
  return format === 'qrcode' ? null : format
}
