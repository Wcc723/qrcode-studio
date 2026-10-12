/**
 * 批次用的 QR Code：直接用 qrcode-generator 算出小方塊（模組）矩陣，再自己輸出 SVG 與 PNG 的畫法。
 *
 * 不經過 qr-code-styling：它每張都要建 canvas 或 DOM 節點，批次幾百張時又慢又佔記憶體；
 * 批次只出黑白、方形模組，用不到它的樣式功能。qr-code-styling 內部用的也是同一套 qrcode-generator，
 * 所以同樣的內容與容錯等級，做出來的碼跟單張產生器一模一樣。
 *
 * - 文字先轉成「一個字元＝一個 UTF-8 位元組」（toQrByteString），中文與 emoji 掃出來才不會是亂碼。
 * - 編碼模式照 qrGeometry 的 qrMode（與 qr-code-styling 相同）：純數字、大寫英數、其他。
 * - 四周留白（靜區）固定 4 個模組：SVG 直接在 viewBox 留 4 格；PNG 照 quietZoneGeometry 算，
 *   模組是整數像素、留白至少 4 格。
 */
import qrcode from 'qrcode-generator'
import type { ErrorCorrectionLevel } from '@/types'
import { toQrByteString } from '../qrByteString'
import { qrMode, qrVersion, quietZoneGeometry, QUIET_ZONE_MODULES } from '../qrGeometry'
import type { RasterPlan, RasterRect } from '../raster'

export interface QrMatrix {
  /** 每邊幾個模組 */
  size: number
  /** 逐列的深色模組：dark[row * size + col] 為 1 是深色 */
  dark: Uint8Array
}

/** 放不下（超過版本 40 的容量）時回 null。 */
export function makeQrMatrix(text: string, ec: ErrorCorrectionLevel): QrMatrix | null {
  const bytes = toQrByteString(text)
  if (qrVersion(bytes, ec) === null) return null
  const qr = qrcode(0, ec)
  qr.addData(bytes, qrMode(bytes))
  qr.make()
  const size = qr.getModuleCount()
  const dark = new Uint8Array(size * size)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (qr.isDark(r, c)) dark[r * size + c] = 1
  }
  return { size, dark }
}

/** 同一列連續的深色模組合併成一段：[列, 起始欄, 長度]。SVG 與 PNG 都靠它把形狀數減到約四分之一。 */
export function qrRuns(m: QrMatrix): Array<[number, number, number]> {
  const runs: Array<[number, number, number]> = []
  for (let r = 0; r < m.size; r++) {
    let c = 0
    while (c < m.size) {
      if (!m.dark[r * m.size + c]) { c++; continue }
      const start = c
      while (c < m.size && m.dark[r * m.size + c]) c++
      runs.push([r, start, c - start])
    }
  }
  return runs
}

/** SVG path 的 d：座標以模組為單位，左上角往右下各推 `offset` 格（預設就是 4 格靜區）。 */
export function qrPathData(m: QrMatrix, offset = QUIET_ZONE_MODULES): string {
  return qrRuns(m).map(([r, c, len]) => `M${c + offset} ${r + offset}h${len}v1h-${len}z`).join('')
}

/**
 * 下載用的 SVG：viewBox 以模組為單位、四周 4 格留白，寬高寫成 `sizePx` 像素（置入文件時的預設大小，
 * 向量圖放大縮小都不會糊）。crispEdges 讓相鄰方塊之間不出現細縫。
 */
export function qrSvg(m: QrMatrix, sizePx: number): string {
  const full = m.size + QUIET_ZONE_MODULES * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${full} ${full}" shape-rendering="crispEdges">`
    + `<rect width="${full}" height="${full}" fill="#ffffff"/>`
    + `<path fill="#000000" d="${qrPathData(m)}"/></svg>`
}

/**
 * PNG 的畫法：整張 `sizePx` × `sizePx`，模組取整數像素，四周至少 4 格留白（跟單張產生器的下載檔同一套幾何）。
 * 連 1 像素的模組都放不下時回 null。
 */
export function qrRasterPlan(m: QrMatrix, sizePx: number): RasterPlan | null {
  const g = quietZoneGeometry(sizePx, m.size)
  if (!g) return null
  const rects: RasterRect[] = qrRuns(m).map(([r, c, len]) => ({
    x: g.margin + c * g.moduleSize,
    y: g.margin + r * g.moduleSize,
    w: len * g.moduleSize,
    h: g.moduleSize,
  }))
  return { width: sizePx, height: sizePx, rects, text: null }
}
