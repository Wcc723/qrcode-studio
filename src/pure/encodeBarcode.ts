/**
 * 一維條碼的位元樣式編碼與 SVG 算圖。零依賴、零 DOM 的純函式。
 *
 * 為什麼自己寫而不用 JsBarcode / bwip-js（2026-09-13 實測）：
 * - 自寫 5 種符號學共 2.4KB gzip；JsBarcode 13.6KB 且無法 tree-shake（CJS、
 *   單一 default export 帶全部 22 種）；bwip-js 55.6KB gzip 且有 ~53KB 固定底盤
 *   （BWIPP runtime ＋ TrueType 字型引擎），另帶 SIL OFL 1.1 字型授權。
 * - JsBarcode 在本 repo 的測試環境根本測不了：它的 SVG renderer 在
 *   displayValue（預設開啟）時會 document.createElement('canvas').getContext('2d')
 *   再設 ctx.font，而 happy-dom 的 getContext('2d') 回傳 null，直接拋錯。
 *   關掉 displayValue 就沒有人眼可讀碼，零售條碼不能這樣出。
 *
 * 位元樣式全部以獨立的 ZXing C++ 解碼器回讀驗證過（見 encodeBarcode.test.ts 的
 * 黃金向量）。自寫編碼表最容易靜默寫錯（稽核時 Code 39 表第一版就是錯的：
 * 輸出看起來正常、不報錯、但模組數不對而掃不出來），所以黃金向量是必要的護欄。
 *
 * 輸入假定已經過 validateBarcode() 正規化；仍做防禦性檢查以免靜默產出壞圖。
 */
import type { BarcodeSymbology } from './validateBarcode'
import { CODE39_CHARSET } from './validateBarcode'

export interface BarcodePattern {
  bits: string          // '1' = 黑條，'0' = 空白，每字元一個模組
  text: string          // 人眼可讀碼（HRI）
  symbology: BarcodeSymbology
  quietLeft: number     // 左靜區，單位為模組
  quietRight: number    // 右靜區，單位為模組（EAN 系列左右不對稱）
  bearerBars: boolean   // ITF-14 的外框
  xDimensionMm: number  // 標準窄模組實體寬度（mm），決定列印尺寸與 DPI
}

export class BarcodeEncodeError extends Error {
  constructor(message: string) { super(message); this.name = 'BarcodeEncodeError' }
}
const bad = (m: string): never => { throw new BarcodeEncodeError(m) }

/* ---------------- Code 128（ISO/IEC 15417） ---------------- */
// 107 個符號樣式：0–102 資料、103–105 起始碼 A/B/C、106 結束碼（13 模組）
const C128 = ['11011001100','11001101100','11001100110','10010011000','10010001100','10001001100','10011001000','10011000100','10001100100','11001001000','11001000100','11000100100','10110011100','10011011100','10011001110','10111001100','10011101100','10011100110','11001110010','11001011100','11001001110','11011100100','11001110100','11101101110','11101001100','11100101100','11100100110','11101100100','11100110100','11100110010','11011011000','11011000110','11000110110','10100011000','10001011000','10001000110','10110001000','10001101000','10001100010','11010001000','11000101000','11000100010','10110111000','10110001110','10001101110','10111011000','10111000110','10001110110','11101110110','11010001110','11000101110','11011101000','11011100010','11011101110','11101011000','11101000110','11100010110','11101101000','11101100010','11100011010','11101111010','11001000010','11110001010','10100110000','10100001100','10010110000','10010000110','10000101100','10000100110','10110010000','10110000100','10011010000','10011000010','10000110100','10000110010','11000010010','11001010000','11110111010','11000010100','10001111010','10100111100','10010111100','10010011110','10111100100','10011110100','10011110010','11110100100','11110010100','11110010010','11011011110','11011110110','11110110110','10101111000','10100011110','10001011110','10111101000','10111100010','11110101000','11110100010','10111011110','10111101110','11101011110','11110101110','11010000100','11010010000','11010011100','1100011101011']

function code128(data: string): string {
  if (!data) bad('Code 128 需要至少一個字元')
  const digitRun = (i: number) => {
    let n = 0
    while (i + n < data.length && data[i + n] >= '0' && data[i + n] <= '9') n++
    return n
  }
  const codes: number[] = []
  let set: 'A' | 'B' | 'C'
  const lead = digitRun(0)
  // 前導數字串 >= 4 位（或整串偶數位數字）用子集 C，雙密度省一半寬度
  if (lead >= 4 || (lead === data.length && lead % 2 === 0 && lead > 0)) { set = 'C'; codes.push(105) }
  else if (/[\x00-\x1f]/.test(data[0])) { set = 'A'; codes.push(103) }
  else { set = 'B'; codes.push(104) }

  let i = 0
  while (i < data.length) {
    if (set === 'C') {
      const run = digitRun(i)
      if (run >= 2) { codes.push(Number(data.slice(i, i + 2))); i += 2; continue }
      set = 'B'; codes.push(100); continue
    }
    const run = digitRun(i)
    const atEnd = i + run === data.length
    if (run >= 4 && (run % 2 === 0 || !atEnd)) {
      if (run % 2 === 1) { codes.push(data.charCodeAt(i) - 32); i++ }  // 先在現子集編一位湊成偶數
      set = 'C'; codes.push(99); continue
    }
    const ch = data.charCodeAt(i)
    if (set === 'B') {
      if (ch < 32) { set = 'A'; codes.push(101); continue }
      codes.push(ch - 32)
    } else {
      if (ch >= 96) { set = 'B'; codes.push(100); continue }
      codes.push(ch < 32 ? ch + 64 : ch - 32)
    }
    i++
  }
  // mod-103 符號檢查字元：起始碼權重 1，其後依位置遞增
  let sum = codes[0]
  for (let k = 1; k < codes.length; k++) sum += codes[k] * k
  codes.push(sum % 103, 106)
  return codes.map(c => C128[c]).join('')
}

/* ---------------- EAN-13 / EAN-8 ---------------- */
const EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011']
const EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111']
const EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100']
// EAN-13 的第 1 位不用條紋編碼，而是靠左半 6 位的 L/G 奇偶樣式表達
const EAN13_PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL']

function ean13(d: string): string {
  if (!/^\d{13}$/.test(d)) bad('EAN-13 需要 13 位數字')
  const p = EAN13_PARITY[Number(d[0])]
  let bits = '101'
  for (let i = 1; i <= 6; i++) bits += (p[i - 1] === 'L' ? EAN_L : EAN_G)[Number(d[i])]
  bits += '01010'
  for (let i = 7; i <= 12; i++) bits += EAN_R[Number(d[i])]
  return bits + '101'
}

function ean8(d: string): string {
  if (!/^\d{8}$/.test(d)) bad('EAN-8 需要 8 位數字')
  let bits = '101'
  for (let i = 0; i < 4; i++) bits += EAN_L[Number(d[i])]
  bits += '01010'
  for (let i = 4; i < 8; i++) bits += EAN_R[Number(d[i])]
  return bits + '101'
}

/* ---------------- Code 39 ---------------- */
// 每字元 9 個元素（3 寬 6 窄），以 3:1 寬窄比展開成 15 個模組。
// '*' 是起始／結束符號，不是資料字元，所以不在 CODE39_CHARSET 內。
const C39_PATTERNS = [
  '101000111011101','111010001010111','101110001010111','111011100010101','101000111010111',
  '111010001110101','101110001110101','101000101110111','111010001011101','101110001011101',
  '111010100010111','101110100010111','111011101000101','101011100010111','111010111000101',
  '101110111000101','101010001110111','111010100011101','101110100011101','101011100011101',
  '111010101000111','101110101000111','111011101010001','101011101000111','111010111010001',
  '101110111010001','101010111000111','111010101110001','101110101110001','101011101110001',
  '111000101010111','100011101010111','111000111010101','100010111010111','111000101110101',
  '100011101110101','100010101110111','111000101011101','100011101011101','100010001000101',
  '100010001010001','100010100010001','101000100010001',
]
const C39_STAR = '100010111011101'

function code39(d: string): string {
  if (!d) bad('Code 39 需要至少一個字元')
  let bits = C39_STAR + '0'
  for (const ch of d) {
    const idx = CODE39_CHARSET.indexOf(ch)
    if (idx < 0) bad(`Code 39 無法編碼「${ch}」`)
    bits += C39_PATTERNS[idx] + '0'   // 字元間以一個窄空白分隔
  }
  return bits + C39_STAR + '0'
}

/* ---------------- ITF-14（Interleaved 2 of 5） ---------------- */
// 每位數字 5 個元素，寬=1、窄=0；兩位交錯，奇數位走條、偶數位走空
const ITF_PATTERNS = ['00110','10001','01001','11000','00101','10100','01100','00011','10010','01010']

function itf14(d: string): string {
  if (!/^\d{14}$/.test(d)) bad('ITF-14 需要 14 位數字')
  let bits = '1010'                                   // 起始樣式
  for (let i = 0; i < 14; i += 2) {
    const a = ITF_PATTERNS[Number(d[i])], b = ITF_PATTERNS[Number(d[i + 1])]
    for (let k = 0; k < 5; k++) {
      bits += (a[k] === '1' ? '111' : '1')             // 條：寬 3 模組、窄 1 模組
      bits += (b[k] === '1' ? '000' : '0')             // 空：同比例
    }
  }
  return bits + '11101'                               // 結束樣式
}

const ENCODERS: Record<BarcodeSymbology, (d: string) => string> = {
  code128, ean13, ean8, code39, itf14,
}

/**
 * 規範要求的靜區（quiet zone），單位為模組寬。靜區不足是實務上最常見的
 * 「印出來掃不到」原因，而且畫面上完全看不出來。
 *
 * EAN 系列刻意左右不對稱，那是規範本身的定義而不是筆誤：EAN-13 左 11、右 7，
 * 左邊多出來的 4 個模組正是要放第 1 位人眼可讀數字的位置。
 * 這組數字也是標稱寬度的來源：EAN-13 共 95+11+7 = 113 模組 × 0.330mm = 37.29mm，
 * EAN-8 共 67+7+7 = 81 模組 × 0.330mm = 26.73mm，兩者都與 GS1 標稱值相符。
 */
const QUIET_ZONE: Record<BarcodeSymbology, { left: number; right: number }> = {
  ean13: { left: 11, right: 7 },
  ean8: { left: 7, right: 7 },
  code128: { left: 10, right: 10 },  // ISO/IEC 15417：至少 10 倍模組寬
  code39: { left: 10, right: 10 },   // 至少 10 倍窄元素寬
  itf14: { left: 10, right: 10 },    // GS1：至少 10 倍，另需外框 bearer bars
}

/**
 * 標準 X 尺寸（單一窄模組的實體寬度，mm）。這是列印尺寸與 DPI 的唯一來源。
 * EAN 系列 0.330mm 是 GS1 的 1.0 倍放大率；ITF-14 的 1.016mm 讓標稱總寬為 6 英吋。
 * 交叉驗算：EAN-13 共 113 模組 × 0.330 = 37.29mm，與 GS1 標稱寬度一致。
 */
const X_DIMENSION_MM: Record<BarcodeSymbology, number> = {
  ean13: 0.33,
  ean8: 0.33,
  code128: 0.33,
  code39: 0.33,
  itf14: 1.016,
}

export function encodeBarcode(sym: BarcodeSymbology, normalized: string): BarcodePattern {
  return {
    bits: ENCODERS[sym](normalized),
    text: normalized,
    symbology: sym,
    quietLeft: QUIET_ZONE[sym].left,
    quietRight: QUIET_ZONE[sym].right,
    // ITF-14 規範要求外框 bearer bars：缺了掃描器容易把截斷的短碼誤讀成合法碼
    bearerBars: sym === 'itf14',
    xDimensionMm: X_DIMENSION_MM[sym],
  }
}

export interface BarcodeSvgOptions {
  moduleWidth?: number   // 單一模組寬度（viewBox 單位）
  height?: number        // 條紋高度
  showText?: boolean     // 是否顯示人眼可讀碼（HRI）
  fontSize?: number
  fg?: string
  bg?: string
  /**
   * true 時根元素改用 mm 實體尺寸（viewBox 仍是模組座標）。下載的 SVG 一定要開：
   * PNG 無法寫入 pHYs（canvas.toBlob 不支援），使用者拉進 Word 隨手縮放就毀了條碼；
   * 帶 mm 的 SVG 置入排版軟體時就是精確的標稱尺寸。
   */
  physicalUnits?: boolean
  /**
   * true 時在根元素加 inline style 讓它填滿容器。刻意用 inline style 而不是 class：
   * 本專案的 UnoCSS 沒有掛 transformerVariantGroup，class 的產生與否有陷阱，
   * inline style 不依賴任何抽取器。
   */
  responsive?: boolean
}

export interface BarcodeRect { x: number; y: number; w: number; h: number }
export interface BarcodeGeometry {
  width: number
  height: number
  bars: BarcodeRect[]
  bearer: BarcodeRect[]
  text: { s: string; x: number; y: number; size: number } | null
  widthMm: number
  heightMm: number
}

/**
 * 幾何計算的唯一事實來源。SVG 預覽、SVG 下載、PNG 下載三條路徑共用這一份，
 * 所以「看到的」與「下載的」不可能不一致。
 */
export function barcodeGeometry(p: BarcodePattern, o: BarcodeSvgOptions = {}): BarcodeGeometry {
  const { moduleWidth = 2, height = 80, showText = true, fontSize = 16 } = o
  const bearerW = p.bearerBars ? Math.max(2, Math.round(moduleWidth * 2)) : 0
  const quietL = p.quietLeft * moduleWidth
  const quietR = p.quietRight * moduleWidth
  const barsW = p.bits.length * moduleWidth
  const textH = showText ? fontSize + 6 : 0
  const width = barsW + quietL + quietR + bearerW * 2
  const totalH = height + textH + bearerW * 2
  const barX = quietL + bearerW
  const barY = bearerW

  const bars: BarcodeRect[] = []
  let run = 0
  for (let i = 0; i <= p.bits.length; i++) {
    if (p.bits[i] === '1') { run++; continue }
    if (run) {
      bars.push({ x: barX + (i - run) * moduleWidth, y: barY, w: run * moduleWidth, h: height })
      run = 0
    }
  }

  // ITF-14 的 bearer bars：上下實線加左右短邊，框住整個符號含靜區。
  // 缺了它掃描器容易把被截斷的短碼誤讀成一個合法的短條碼。
  const bearer: BarcodeRect[] = bearerW ? [
    { x: 0, y: 0, w: width, h: bearerW },
    { x: 0, y: height + bearerW, w: width, h: bearerW },
    { x: 0, y: 0, w: bearerW, h: height + bearerW * 2 },
    { x: width - bearerW, y: 0, w: bearerW, h: height + bearerW * 2 },
  ] : []

  const mmPerUnit = p.xDimensionMm / moduleWidth
  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    width,
    height: totalH,
    bars,
    bearer,
    text: showText ? { s: p.text, x: width / 2, y: totalH - 4, size: fontSize } : null,
    widthMm: round2(width * mmPerUnit),
    heightMm: round2(totalH * mmPerUnit),
  }
}

const escapeXml = (s: string) =>
  s.replace(/[<&>"']/g, c => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!))

/**
 * 純字串 SVG 算圖，完全不碰 DOM，所以 SSR 預渲染與 happy-dom 測試都能跑。
 * 回傳的是真向量：條紋是 <rect>，人眼可讀碼是 <text>。
 */
export function barcodeToSvg(p: BarcodePattern, o: BarcodeSvgOptions = {}): string {
  const { fg = '#000000', bg = '#ffffff', physicalUnits = false, responsive = false } = o
  const g = barcodeGeometry(p, o)

  const sizeAttrs = physicalUnits
    ? `width="${g.widthMm}mm" height="${g.heightMm}mm"`
    : `width="${g.width}" height="${g.height}"`
  const styleAttr = responsive ? ' style="width:100%;height:auto;display:block"' : ''

  const rect = (r: BarcodeRect) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`
  const label = g.text
    ? `<text x="${g.text.x}" y="${g.text.y}" text-anchor="middle" font-family="monospace"`
      + ` font-size="${g.text.size}" fill="${fg}">${escapeXml(g.text.s)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs} viewBox="0 0 ${g.width} ${g.height}"${styleAttr}>`
    + `<rect width="${g.width}" height="${g.height}" fill="${bg}"/>`
    + `<g fill="${fg}">${g.bearer.map(rect).join('')}${g.bars.map(rect).join('')}</g>`
    + `${label}</svg>`
}
