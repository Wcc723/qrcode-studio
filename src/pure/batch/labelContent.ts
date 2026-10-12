/**
 * 一格標籤裡的東西怎麼放（純函式）：碼放多大、放哪裡，一到三行字的字級，以及放不下時的原因。
 *
 * 輸入是格子扣掉內距（與印表機印不到的紙邊）之後的範圍（labelLayout.ts 的 contentBox），輸出的座標以那個範圍的
 * 左上角為原點，單位 mm。量字寬的函式由呼叫端注入（瀏覽器裡是 canvas，跟預覽、列印同一個字型）。
 *
 * - QR Code：格子夠寬（右邊留得出 SIDE_MIN_TEXT_MM 給字）時碼在左、字在右（side），否則碼在上、字在下（stack）。
 *   只看格子的形狀、不看字的長短，同一張紙上每一格的排法一致；字太長就縮小、再截斷。四周 4 格留白（靜區）算在碼的範圍裡。
 * - 一維條碼：條碼在上，下面一行號碼，再下面是使用者選的字。最細的線（窄條）寬度照格子寬算，
 *   低於 paper.ts 的下限就擋下（不輸出掃不到的標籤），低於建議值提醒。條高太矮也擋下。
 * - 字級：每一行依自己的長度縮到放得下，最小 MIN_LABEL_FONT_PT；縮到最小還放不下就截斷、最後補「…」並標示。
 */
import { barcodeGeometry, type BarcodePattern, type BarcodeRect } from '../encodeBarcode'
import type { BarcodeSymbology } from '../validateBarcode'
import { QUIET_ZONE_MODULES } from '../qrGeometry'
import {
  BARCODE_MAX_HEIGHT_RATIO, BARCODE_MAX_X_MM, BARCODE_MIN_BAR_HEIGHT_MM, BARCODE_MIN_X_MM, BARCODE_WARN_X_MM,
  CONTENT_GAP_MM, HRI_HEIGHT_MODULES, LINE_HEIGHT, MAX_HRI_FONT_PT, MAX_LABEL_FONT_PT, MIN_LABEL_FONT_PT,
  QR_MIN_MODULE_MM, QR_WARN_MODULE_MM, SIDE_CODE_MAX_SHARE, SIDE_MIN_TEXT_MM, STACK_TEXT_MAX_SHARE, TEXT_WIDTH_SAFETY, mmToPt, ptToMm,
} from './paper'
import { emWidth, type MeasureText } from './printFonts'
import type { QrMatrix } from './qrMatrix'
import { qrPathData } from './qrMatrix'
import type { Rect } from './labelLayout'

export interface Size { w: number; h: number }

/** 碼本身：QR Code 給模組數（含四周留白），一維條碼給總寬的模組數（含靜區與外框）與下方的號碼 */
export type CellCode =
  | { kind: 'qr'; modules: number }
  | { kind: 'barcode'; symbology: BarcodeSymbology; modules: number; hri: string }

export interface TextStyle {
  /** CSS font-family 堆疊 */
  family: string
  /** 第一行粗一點（通常是編號或品名），其他行一般粗細 */
  firstWeight: number
  weight: number
}

export interface FittedLine {
  /** 印出來的字；截斷時最後是「…」 */
  text: string
  pt: number
  truncated: boolean
}

export interface PlacedLine extends FittedLine {
  x: number
  y: number
  w: number
  h: number
  align: 'center' | 'left'
  weight: number
  /** 條碼下方的號碼 */
  hri: boolean
}

export type CellIssue =
  | { kind: 'no-room' }
  | { kind: 'barcode-narrow'; xMm: number; minMm: number }
  | { kind: 'barcode-short'; barMm: number; minMm: number }
  | { kind: 'barcode-thin'; xMm: number; recommendMm: number }
  | { kind: 'qr-tiny'; moduleMm: number; minMm: number }
  | { kind: 'qr-small'; moduleMm: number; recommendMm: number }

/** 這幾種會擋下列印；其他只提醒 */
export function isBlocking(issue: CellIssue | null): boolean {
  return !!issue && issue.kind !== 'barcode-thin' && issue.kind !== 'qr-small'
}

export interface CellLayout {
  /** 碼的位置（相對於可放東西的範圍）；放不下時是 null */
  code: Rect | null
  /** 一個模組（QR 的小方塊、一維條碼最細的線）的寬度 */
  moduleMm: number
  lines: PlacedLine[]
  issue: CellIssue | null
  /** 有一行字被截斷 */
  truncated: boolean
}

const round3 = (n: number) => Math.round(n * 1000) / 1000
const floorHalf = (n: number) => Math.floor(n * 2) / 2
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** 一行字（pt）佔的高度 */
export function lineHeightMm(sizePt: number): number {
  return ptToMm(sizePt) * LINE_HEIGHT
}

/**
 * 一行字在 maxWidthMm 寬度裡的字級：不大於 maxPt，放不下就縮小；縮到 MIN_LABEL_FONT_PT 還放不下，
 * 就從後面截掉、補上「…」。maxPt 比最小字級還小時仍用最小字級（高度不夠由呼叫端處理）。
 */
export function fitLine(text: string, maxWidthMm: number, maxPt: number, family: string, weight: number, measure: MeasureText): FittedLine {
  const usable = Math.max(0, maxWidthMm) * TEXT_WIDTH_SAFETY
  const em = emWidth(measure, family, weight, text)
  const cap = Math.max(MIN_LABEL_FONT_PT, Math.min(MAX_LABEL_FONT_PT, maxPt))
  const size = floorHalf(Math.min(cap, em > 0 ? mmToPt(usable / em) : cap))
  if (size >= MIN_LABEL_FONT_PT) return { text, pt: size, truncated: false }
  const minMm = ptToMm(MIN_LABEL_FONT_PT)
  const chars = [...text]
  let lo = 0
  let hi = chars.length - 1
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (emWidth(measure, family, weight, `${chars.slice(0, mid).join('')}…`) * minMm <= usable) lo = mid
    else hi = mid - 1
  }
  return { text: `${chars.slice(0, lo).join('')}…`, pt: MIN_LABEL_FONT_PT, truncated: true }
}

function fitLines(texts: readonly string[], widthMm: number, maxPt: number, style: TextStyle, measure: MeasureText): FittedLine[] {
  return texts.map((t, i) => fitLine(t, widthMm, maxPt, style.family, i === 0 ? style.firstWeight : style.weight, measure))
}

function placeLines(
  fitted: FittedLine[], x: number, y: number, w: number, align: PlacedLine['align'], style: TextStyle, hriFirst = false,
): PlacedLine[] {
  // 上下緣先累加、最後才取到 0.001 mm：每一行的下緣剛好是下一行的上緣，不會因為各自取整而重疊
  let top = y
  return fitted.map((f, i) => {
    const bottom = top + lineHeightMm(f.pt)
    const hri = hriFirst && i === 0
    const userIndex = hriFirst ? i - 1 : i
    const line: PlacedLine = {
      ...f, x: round3(x), y: round3(top), w: round3(w), h: round3(round3(bottom) - round3(top)), align, hri,
      weight: hri ? style.weight : userIndex === 0 ? style.firstWeight : style.weight,
    }
    top = bottom
    return line
  })
}

const noRoom = (): CellLayout => ({ code: null, moduleMm: 0, lines: [], issue: { kind: 'no-room' }, truncated: false })

/* ---------- QR Code ---------- */

interface QrCandidate { layout: CellLayout; size: number }

function qrIssue(moduleMm: number): CellIssue | null {
  if (moduleMm < QR_MIN_MODULE_MM) return { kind: 'qr-tiny', moduleMm: round3(moduleMm), minMm: QR_MIN_MODULE_MM }
  if (moduleMm < QR_WARN_MODULE_MM) return { kind: 'qr-small', moduleMm: round3(moduleMm), recommendMm: QR_WARN_MODULE_MM }
  return null
}

function qrStack(box: Size, modules: number, texts: readonly string[], style: TextStyle, measure: MeasureText): QrCandidate | null {
  const n = texts.length
  const maxPt = n ? mmToPt((box.h * STACK_TEXT_MAX_SHARE) / n / LINE_HEIGHT) : 0
  const fitted = fitLines(texts, box.w, maxPt, style, measure)
  const textH = sum(fitted.map(f => lineHeightMm(f.pt)))
  const gap = n ? CONTENT_GAP_MM : 0
  const size = Math.min(box.w, box.h - textH - gap)
  if (size <= 0) return null
  const top = (box.h - (size + gap + textH)) / 2
  const moduleMm = size / modules
  const lines = placeLines(fitted, 0, top + size + gap, box.w, 'center', style)
  return {
    size,
    layout: {
      code: { x: round3((box.w - size) / 2), y: round3(top), w: round3(size), h: round3(size) },
      moduleMm: round3(moduleMm), lines, issue: qrIssue(moduleMm), truncated: fitted.some(f => f.truncated),
    },
  }
}

function qrSide(box: Size, modules: number, texts: readonly string[], style: TextStyle, measure: MeasureText): QrCandidate | null {
  const n = texts.length
  const size = Math.min(box.h, box.w * SIDE_CODE_MAX_SHARE)
  const textW = box.w - size - CONTENT_GAP_MM
  if (size <= 0 || textW <= 0) return null
  const fitted = fitLines(texts, textW, mmToPt(box.h / n / LINE_HEIGHT), style, measure)
  const textH = sum(fitted.map(f => lineHeightMm(f.pt)))
  if (textH > box.h + 1e-6) return null
  const moduleMm = size / modules
  const lines = placeLines(fitted, size + CONTENT_GAP_MM, (box.h - textH) / 2, textW, 'left', style)
  return {
    size,
    layout: {
      code: { x: 0, y: round3((box.h - size) / 2), w: round3(size), h: round3(size) },
      moduleMm: round3(moduleMm), lines, issue: qrIssue(moduleMm), truncated: fitted.some(f => f.truncated),
    },
  }
}

/** 這個範圍要不要把 QR Code 放左邊、字放右邊：只看形狀 */
export function prefersSide(box: Size): boolean {
  return box.w - Math.min(box.h, box.w * SIDE_CODE_MAX_SHARE) - CONTENT_GAP_MM >= SIDE_MIN_TEXT_MM
}

/**
 * QR Code 加字：照格子的形狀選擺法（prefersSide）。選中的擺法排不下、或小方塊小到要擋下而另一種不會時，才換另一種。
 */
export function layoutQrCell(box: Size, modules: number, texts: readonly string[], style: TextStyle, measure: MeasureText): CellLayout {
  if (box.w <= 0 || box.h <= 0) return noRoom()
  if (!texts.length) return qrStack(box, modules, texts, style, measure)?.layout ?? noRoom()
  const side = qrSide(box, modules, texts, style, measure)
  const stack = qrStack(box, modules, texts, style, measure)
  const [first, second] = prefersSide(box) ? [side, stack] : [stack, side]
  if (first && (!isBlocking(first.layout.issue) || !second || isBlocking(second.layout.issue))) return first.layout
  return (second ?? first)?.layout ?? noRoom()
}

/* ---------- 一維條碼 ---------- */

/**
 * 一維條碼加字：條碼的窄條寬度 = 可用寬度 ÷ 總模組數（不超過上限），條高用剩下的高度（不超過寬度的六成）。
 * 條高不夠時先把使用者的字縮到最小字級再算一次。
 */
export function layoutBarcodeCell(
  box: Size, code: Extract<CellCode, { kind: 'barcode' }>, texts: readonly string[], style: TextStyle, measure: MeasureText,
): CellLayout {
  if (box.w <= 0 || box.h <= 0) return noRoom()
  const x = Math.min(box.w / code.modules, BARCODE_MAX_X_MM[code.symbology])
  const symbolW = code.modules * x
  const hriPt = Math.min(MAX_HRI_FONT_PT, Math.max(MIN_LABEL_FONT_PT, mmToPt(x * HRI_HEIGHT_MODULES)))
  const hri = fitLine(code.hri, box.w, hriPt, style.family, style.weight, measure)
  const n = texts.length

  const attempt = (maxPt: number) => {
    const fitted = fitLines(texts, box.w, maxPt, style, measure)
    const fixed = lineHeightMm(hri.pt) + CONTENT_GAP_MM + (n ? CONTENT_GAP_MM + sum(fitted.map(f => lineHeightMm(f.pt))) : 0)
    return { fitted, fixed, barH: Math.min(box.h - fixed, symbolW * BARCODE_MAX_HEIGHT_RATIO) }
  }
  let a = attempt(n ? mmToPt((box.h * STACK_TEXT_MAX_SHARE) / n / LINE_HEIGHT) : 0)
  if (a.barH < BARCODE_MIN_BAR_HEIGHT_MM && n) a = attempt(MIN_LABEL_FONT_PT)

  let issue: CellIssue | null = null
  if (x < BARCODE_MIN_X_MM[code.symbology]) issue = { kind: 'barcode-narrow', xMm: round3(x), minMm: BARCODE_MIN_X_MM[code.symbology] }
  else if (a.barH < BARCODE_MIN_BAR_HEIGHT_MM) issue = { kind: 'barcode-short', barMm: round3(Math.max(0, a.barH)), minMm: BARCODE_MIN_BAR_HEIGHT_MM }
  else {
    const recommend = BARCODE_WARN_X_MM[code.symbology]
    if (recommend && x < recommend) issue = { kind: 'barcode-thin', xMm: round3(x), recommendMm: recommend }
  }
  if (a.barH <= 0) return { ...noRoom(), issue }

  const total = a.barH + a.fixed
  const top = (box.h - total) / 2
  const lines = placeLines([hri, ...a.fitted], 0, top + a.barH + CONTENT_GAP_MM, box.w, 'center', style, true)
  // 號碼與使用者的字之間多一個間距
  for (const line of lines) if (!line.hri) line.y = round3(line.y + CONTENT_GAP_MM)
  const truncated = lines.some(l => l.truncated)
  return {
    code: { x: round3((box.w - symbolW) / 2), y: round3(top), w: round3(symbolW), h: round3(a.barH) },
    moduleMm: round3(x), lines, issue, truncated,
  }
}

/** 一格的排法：依碼的種類分給上面兩個函式；texts 是要印的字（空字串的行先拿掉） */
export function layoutCell(box: Size, code: CellCode, texts: readonly string[], style: TextStyle, measure: MeasureText): CellLayout {
  const shown = texts.filter(t => t.trim() !== '')
  return code.kind === 'qr'
    ? layoutQrCell(box, code.modules, shown, style, measure)
    : layoutBarcodeCell(box, code, shown, style, measure)
}

/* ---------- 碼的 SVG（向量，viewBox 以模組為單位，寬高由元件用 mm 指定） ---------- */

export interface CodeSvgParts { viewBox: string; d: string }

/** QR Code：四周 4 格留白，跟批次下載的 SVG 同一份路徑 */
export function qrLabelSvg(m: QrMatrix): CodeSvgParts {
  const full = m.size + QUIET_ZONE_MODULES * 2
  return { viewBox: `0 0 ${full} ${full}`, d: qrPathData(m) }
}

/** QR Code 含四周留白的模組數 */
export function qrLabelModules(m: QrMatrix): number {
  return m.size + QUIET_ZONE_MODULES * 2
}

/** 一維條碼含靜區與外框的總寬（模組數） */
export function barcodeLabelModules(p: BarcodePattern): number {
  return barcodeGeometry(p, { moduleWidth: 1, height: 1, showText: false }).width
}

const rectPath = (rects: BarcodeRect[]) => rects.map(r => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`).join('')

/**
 * 一維條碼：viewBox 以窄條寬度為 1，條高照 heightMm ÷ xMm 換算（ITF-14 的上下外框算在高度裡），
 * 號碼不畫在 SVG 裡（另外用文字排在下面）。
 */
export function barcodeLabelSvg(p: BarcodePattern, xMm: number, heightMm: number): CodeSvgParts {
  const bearer = p.bearerBars ? barcodeGeometry(p, { moduleWidth: 1, height: 1, showText: false }).bearer[0]!.h : 0
  const barModules = Math.max(1, heightMm / xMm - bearer * 2)
  const g = barcodeGeometry(p, { moduleWidth: 1, height: round3(barModules), showText: false })
  return { viewBox: `0 0 ${g.width} ${round3(g.height)}`, d: rectPath([...g.bearer, ...g.bars]) }
}
