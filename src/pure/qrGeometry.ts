/**
 * QR Code 的每邊模組數，以及下載檔的幾何：四周留白（靜區）至少 4 個模組寬。
 *
 * 為什麼要自己算模組數
 * --------------------
 * qr-code-styling 的 `margin` 單位是像素，不是模組；以前固定給 8 px，1000 px、25 × 25 的碼每個模組 39 px，
 * 四周實際只留了 12 px（約 0.3 個模組），不到規格要求的 4 個模組。要用模組算留白，就得先知道這張碼有幾個模組，
 * 而套件只把它放在私有欄位（`_qr`）裡。所以這裡照 QR Code 規格自己推：先依內容選編碼模式，算出需要的位元數，
 * 再找最小放得下的版本；版本 v 的碼每邊 17 + 4v 個模組。
 *
 * - 模式的判斷與 qr-code-styling 相同（它用的正規表示式照抄）：全是數字、全是大寫英數與少數符號、其他。
 *   輸入的是交給套件的字串（`toQrByteString` 之後），一個字元就是一個位元組。
 * - 各版本可放的資料量是 ISO/IEC 18004 的表，`qrGeometry.test.ts` 逐版本拿套件內建的 qrcode-generator 對帳。
 */
import type { ErrorCorrectionLevel } from '@/types'

/** 規格要求的四周留白，單位是模組 */
export const QUIET_ZONE_MODULES = 4

/** 各容錯等級在版本 1–40 可以放的資料量（8 位元一組的組數）。 */
const DATA_CODEWORDS: Record<ErrorCorrectionLevel, readonly number[]> = {
  L: [19, 34, 55, 80, 108, 136, 156, 194, 232, 274, 324, 370, 428, 461, 523, 589, 647, 721, 795, 861, 932, 1006, 1094, 1174, 1276, 1370, 1468, 1531, 1631, 1735, 1843, 1955, 2071, 2191, 2306, 2434, 2566, 2702, 2812, 2956],
  M: [16, 28, 44, 64, 86, 108, 124, 154, 182, 216, 254, 290, 334, 365, 415, 453, 507, 563, 627, 669, 714, 782, 860, 914, 1000, 1062, 1128, 1193, 1267, 1373, 1455, 1541, 1631, 1725, 1812, 1914, 1992, 2102, 2216, 2334],
  Q: [13, 22, 34, 48, 62, 76, 88, 110, 132, 154, 180, 206, 244, 261, 295, 325, 367, 397, 445, 485, 512, 568, 614, 664, 718, 754, 808, 871, 911, 985, 1033, 1115, 1171, 1231, 1286, 1354, 1426, 1502, 1582, 1666],
  H: [9, 16, 26, 36, 46, 60, 66, 86, 100, 122, 140, 158, 180, 197, 223, 253, 283, 313, 341, 385, 406, 442, 464, 514, 538, 596, 628, 661, 701, 745, 793, 845, 901, 961, 986, 1054, 1096, 1142, 1222, 1276],
}

export type QrMode = 'Numeric' | 'Alphanumeric' | 'Byte'

/** 與 qr-code-styling 自動選模式的規則相同。 */
export function qrMode(data: string): QrMode {
  if (/^[0-9]*$/.test(data)) return 'Numeric'
  if (/^[0-9A-Z $%*+\-./:]*$/.test(data)) return 'Alphanumeric'
  return 'Byte'
}

/** 「有幾個字」那一欄的位元數，依版本分三段。 */
function countBits(mode: QrMode, version: number): number {
  const band = version < 10 ? 0 : version < 27 ? 1 : 2
  return { Numeric: [10, 12, 14], Alphanumeric: [9, 11, 13], Byte: [8, 16, 16] }[mode][band]
}

function payloadBits(mode: QrMode, length: number): number {
  if (mode === 'Numeric') return 10 * Math.floor(length / 3) + [0, 4, 7][length % 3]
  if (mode === 'Alphanumeric') return 11 * Math.floor(length / 2) + 6 * (length % 2)
  return 8 * length
}

/** 放得下這段內容的最小版本（1–40）；版本 40 也放不下時回 null。 */
export function qrVersion(data: string, ec: ErrorCorrectionLevel): number | null {
  const mode = qrMode(data)
  const bits = payloadBits(mode, data.length)
  for (let v = 1; v <= 40; v++) {
    if (4 + countBits(mode, v) + bits <= DATA_CODEWORDS[ec][v - 1] * 8) return v
  }
  return null
}

/** 每邊幾個模組；放不下時回 null。 */
export function qrModuleCount(data: string, ec: ErrorCorrectionLevel): number | null {
  const v = qrVersion(data, ec)
  return v === null ? null : 17 + 4 * v
}

export interface QrGeometry {
  /** 整張圖的寬高（像素），就是使用者選的「圖片大小」 */
  size: number
  /** 每邊幾個模組 */
  moduleCount: number
  /** 一個模組幾像素（整數，邊緣才不會糊） */
  moduleSize: number
  /** 交給 qr-code-styling 的 margin（像素）：碼從這裡開始畫，左、上兩邊的留白就是它 */
  margin: number
  /** 四邊裡最窄的留白，單位是模組 */
  quietZone: number
}

/**
 * 整張圖維持使用者選的大小，碼縮進四周至少 4 個模組的留白裡。
 *
 * 模組取放得下「碼 + 兩側各 4 模組」的最大整數像素；margin 取剩下空間的一半（無條件捨去）。
 * qr-code-styling 會用 `floor((size - 2 × margin) / 模組數)` 當模組大小、`floor((size - 模組數 × 模組大小) / 2)`
 * 當起點，這樣給的 margin 會讓它算出同一個模組大小，起點也正好等於 margin（推導見測試）。
 *
 * 連 1 像素的模組都放不下時回 null：呼叫端要擋下載並請使用者放大圖片或縮短內容，不能輸出不合規格的圖。
 */
export function quietZoneGeometry(size: number, moduleCount: number | null): QrGeometry | null {
  if (moduleCount === null || !Number.isFinite(size)) return null
  const moduleSize = Math.floor(size / (moduleCount + 2 * QUIET_ZONE_MODULES))
  if (moduleSize < 1) return null
  const margin = Math.floor((size - moduleCount * moduleSize) / 2)
  return { size, moduleCount, moduleSize, margin, quietZone: margin / moduleSize }
}
