/**
 * 每一張的檔案內容：SVG 文字，或 PNG 的畫法（交給 canvas 畫，見 src/utils/batch-export.ts）。
 * 純函式；輸入是 checkRows 檢查過的 `normalized`。
 *
 * - QR Code：qrMatrix.ts 的 SVG 與畫法，四周 4 格留白，圖片大小就是整張的寬高。
 * - 一維條碼：跟條碼產生器下載的一樣。SVG 帶毫米尺寸（置入排版軟體就是標準大小），
 *   PNG 照「PNG 清晰度」讓最細的線佔 2、4、8 像素，靜區沿用 encodeBarcode 的規範值。
 */
import type { ErrorCorrectionLevel } from '@/types'
import { encodeBarcode, barcodeDownloadSvg } from '../encodeBarcode'
import { barcodeRasterPlan, type RasterPlan } from '../raster'
import { makeQrMatrix, qrRasterPlan, qrSvg } from './qrMatrix'
import type { BatchSymbology } from './rows'

export interface ArtifactSettings {
  symbology: BatchSymbology
  ec: ErrorCorrectionLevel
  /** QR Code 的圖片大小（像素）：PNG 的寬高，也是 SVG 置入文件時的預設大小 */
  qrSize: number
  /** 一維條碼 PNG 的清晰度：最細的線佔幾像素 */
  barcodeScale: number
}

const XML_PROLOG = '<?xml version="1.0" encoding="UTF-8"?>\n'

/** 下載用的 SVG 檔內容；編不出來時回 null（檢查過的列不會發生）。 */
export function artifactSvg(normalized: string, s: ArtifactSettings): string | null {
  if (s.symbology === 'qr') {
    const m = makeQrMatrix(normalized, s.ec)
    return m ? XML_PROLOG + qrSvg(m, s.qrSize) : null
  }
  try {
    return barcodeDownloadSvg(encodeBarcode(s.symbology, normalized))
  } catch {
    return null
  }
}

/** PNG 的畫法；編不出來或圖片太小放不下時回 null。 */
export function artifactPlan(normalized: string, s: ArtifactSettings): RasterPlan | null {
  if (s.symbology === 'qr') {
    const m = makeQrMatrix(normalized, s.ec)
    return m ? qrRasterPlan(m, s.qrSize) : null
  }
  try {
    return barcodeRasterPlan(encodeBarcode(s.symbology, normalized), s.barcodeScale)
  } catch {
    return null
  }
}
