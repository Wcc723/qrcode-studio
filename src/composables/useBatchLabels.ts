/**
 * 印成 A4 標籤紙：型號或自訂尺寸、從第 N 格開始、每筆 N 份、每格的字、字型、紙邊內縮、X／Y 位移，
 * 以及排好的每一頁（交給 LabelSheets.vue 畫）、擋下列印的原因與提醒。
 *
 * 狀態跟著批次頁的工具卡（BatchTool）：切回「下載 ZIP」再切回來，設定還在。清單一樣只在記憶體；
 * 唯一會寫進瀏覽器的是使用者勾選「記住這台印表機的位移」時的兩個數字（src/utils/batch-label-offset.ts）。
 * GA 只在按下「列印標籤」時送筆數級距、碼制與輸出方式 label（src/utils/batch-analytics.ts）。
 */
import { computed, onMounted, reactive, ref, shallowRef, watch, type Ref } from 'vue'
import type { ErrorCorrectionLevel } from '@/types'
import type { ParsedTable } from '@/pure/batch/table'
import type { BatchSymbology, ReadyRow } from '@/pure/batch/rows'
import { formatCount } from '@/pure/batch/sequence'
import { encodeBarcode, type BarcodePattern } from '@/pure/encodeBarcode'
import { BARCODE_MIN_X_MM, BARCODE_WARN_X_MM, MIN_LABEL_FONT_PT, PRINTER_EDGE_RANGE } from '@/pure/batch/paper'
import { BRAND_NAMES, DEFAULT_SHEET_ID, LABEL_SHEETS, sheetById, sheetCells, type LabelGrid } from '@/pure/batch/labelSheets'
import {
  LABEL_MAX_CELLS, LABEL_MAX_COPIES, clampOffset, contentBox, customInputFrom, edgeCellCount, normalizePlacement,
  parseCustomGrid, placeLabels, slotCount, testPageCells, type CustomGridInput, type Rect,
} from '@/pure/batch/labelLayout'
import {
  barcodeLabelModules, barcodeLabelSvg, isBlocking, layoutCell, qrLabelModules, qrLabelSvg,
  type CellCode, type CellIssue, type CellLayout, type CodeSvgParts, type PlacedLine, type TextStyle,
} from '@/pure/batch/labelContent'
import { makeQrMatrix } from '@/pure/batch/qrMatrix'
import {
  DEFAULT_PRINT_FONT, PRINT_FONTS, cachedMeasure, detectFont, estimateMeasure, printFont,
  type MeasureText, type PrintFontId,
} from '@/pure/batch/printFonts'
import { forgetPrinterOffset, loadPrinterOffset, savePrinterOffset } from '@/utils/batch-label-offset'
import { trackBatchDownload } from '@/utils/batch-analytics'
import type { ColumnOption, InputMode } from './useBatch'

export interface LabelSourceRefs {
  ready: Readonly<Ref<readonly ReadyRow[]>>
  mode: Readonly<Ref<InputMode>>
  table: Readonly<Ref<ParsedTable>>
  headerCells: Readonly<Ref<string[] | null>>
  columns: Readonly<Ref<ColumnOption[]>>
  contentCol: Readonly<Ref<number>>
  symbology: Readonly<Ref<BatchSymbology>>
  ec: Readonly<Ref<ErrorCorrectionLevel>>
  /** 清單本身不能產生的原因（useBatch 的 blocker） */
  blocker: Readonly<Ref<string | null>>
  lineUnit: Readonly<Ref<string>>
}

/** 每一行字印什麼：不印、內容本身、貼上的某一欄 */
export type LineSource = 'none' | 'value' | `col:${number}`
/** 要印的是標籤，還是只有格線與格號的對位測試頁 */
export type PrintTarget = 'labels' | 'test'

export const CUSTOM_SHEET = 'custom'
export const LINE_COUNT = 3
/** 螢幕上先畫幾張預覽，其他的只在列印時出現（使用者可以展開） */
export const PREVIEW_SHEETS = 3

export interface RenderCode {
  kind: 'qr' | 'barcode'
  /** 相對於可放東西的範圍 */
  rect: Rect
  viewBox: string
  d: string
}

export interface RenderCell {
  key: string
  /** 這張紙上的第幾格（0 起算） */
  index: number
  /** 格子在紙上的位置（加過位移） */
  rect: Rect
  /** 可放東西的範圍，相對於格子 */
  box: Rect
  /** 「從第 N 格開始」前面留白的格子，或還沒有清單時的空格 */
  blank: boolean
  /** 這一格的碼印出來會掃不到：不畫碼也不畫字（就算用 Ctrl＋P 繞過停用的列印鈕也不會印出來），螢幕上標出原因 */
  blocked: string | null
  /** 這一格是清單的第幾列（第幾行、第幾筆） */
  line: number | null
  code: RenderCode | null
  lines: PlacedLine[]
}

export interface RenderPage {
  key: string
  cells: RenderCell[]
}

export interface LabelNotice {
  id: string
  level: 'block' | 'warn' | 'info'
  text: string
}

interface LabelItem {
  key: string
  line: number
  normalized: string
  texts: string[]
}

interface CodeInfo {
  code: CellCode
  qr: CodeSvgParts | null
  pattern: BarcodePattern | null
}

const URLISH = /^[a-z][a-z0-9+.-]*:/i
const SYMBOLOGY_LABEL: Record<BatchSymbology, string> = {
  qr: 'QR Code', code128: 'Code 128', ean13: 'EAN-13', ean8: 'EAN-8', code39: 'Code 39', itf14: 'ITF-14',
}

/** 掛載後才有的量字函式：canvas 的 measureText（跟預覽、列印同一個字型）；沒有 canvas 時回 null */
function canvasMeasure(): MeasureText | null {
  if (typeof document === 'undefined') return null
  let context: CanvasRenderingContext2D | null = null
  try {
    context = document.createElement('canvas').getContext('2d')
  } catch {
    return null
  }
  if (!context) return null
  const ctx = context
  return (font, text) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}

/** 「第 3、5、8 列」；超過 8 個只列前 8 個再寫總數 */
function whichLines(lines: readonly number[], unit: string): string {
  const sorted = [...lines].sort((a, b) => a - b)
  const shown = sorted.slice(0, 8).join('、')
  return `第 ${shown}${sorted.length > 8 ? ` 等 ${formatCount(sorted.length)}` : ''} ${unit}`
}

export function useBatchLabels(src: LabelSourceRefs) {
  /* ---------- 設定 ---------- */

  const sheetId = ref<string>(DEFAULT_SHEET_ID)
  const custom = reactive<CustomGridInput>(customInputFrom(sheetById[DEFAULT_SHEET_ID]!))
  const startCell = ref<number | ''>(1)
  const copies = ref<number | ''>(1)
  const lineSources = ref<LineSource[]>(['value', 'none', 'none'])
  const fontId = ref<PrintFontId>(DEFAULT_PRINT_FONT)
  const avoidEdge = ref(true)
  const offsetX = ref<number | ''>(0)
  const offsetY = ref<number | ''>(0)
  const rememberOffset = ref(false)
  const target = ref<PrintTarget>('labels')
  const showAllSheets = ref(false)

  // 選「自訂」時，從剛剛的型號數字開始改
  watch(sheetId, (next, prev) => {
    if (next === CUSTOM_SHEET && prev !== CUSTOM_SHEET && sheetById[prev]) Object.assign(custom, customInputFrom(sheetById[prev]!))
  })

  const gridResult = computed(() => (sheetId.value === CUSTOM_SHEET
    ? parseCustomGrid(custom)
    : { ok: true as const, grid: (sheetById[sheetId.value] ?? sheetById[DEFAULT_SHEET_ID]!) as LabelGrid }))
  const grid = computed<LabelGrid | null>(() => (gridResult.value.ok ? gridResult.value.grid : null))
  const perSheet = computed(() => (grid.value ? sheetCells(grid.value) : 0))
  // 換成格數比較少的型號時，起始格拉回這一張的範圍，畫面上的數字才跟實際一致
  watch(perSheet, (n) => { if (n && Number(startCell.value) > n) startCell.value = n })
  const sheetName = computed(() => {
    const s = sheetById[sheetId.value]
    return s ? `${BRAND_NAMES[s.brand]} ${s.model}` : '自訂尺寸'
  })

  const offset = computed(() => ({ xMm: clampOffset(offsetX.value), yMm: clampOffset(offsetY.value) }))
  const placement = computed(() => (grid.value
    ? normalizePlacement(grid.value, Number(startCell.value), Number(copies.value))
    : { startCell: 1, copies: 1 }))

  /* ---------- 每格的字 ---------- */

  const isBarcode = computed(() => src.symbology.value !== 'qr')
  /** 內容欄是網址的話，預設不把整串網址印在標籤上 */
  const contentIsUrl = computed(() => src.ready.value.slice(0, 20).some(r => URLISH.test(r.value)))

  function defaultLines(): LineSource[] {
    const others: LineSource[] = src.mode.value === 'paste'
      ? src.columns.value.filter(c => c.index !== src.contentCol.value).map(c => `col:${c.index}` as const)
      : []
    const picks: LineSource[] = isBarcode.value || contentIsUrl.value ? others : ['value', ...others]
    return Array.from({ length: LINE_COUNT }, (_, i) => picks[i] ?? 'none')
  }
  // 輸入方式、欄位或碼的種類換了才重設；只改資料列時保留使用者選的
  watch(
    () => [src.mode.value, src.table.value.columnCount, src.headerCells.value?.join('\t') ?? '', src.contentCol.value, isBarcode.value, contentIsUrl.value].join('\u0000'),
    () => { lineSources.value = defaultLines() },
    { immediate: true },
  )

  /** 每一行可以選的來源 */
  const lineOptions = computed<{ value: LineSource; label: string }[]>(() => {
    const valueLabel = src.mode.value === 'paste' ? '內容欄的值' : src.mode.value === 'lines' ? '這一行的內容' : '連號'
    return [
      { value: 'none', label: '（不印）' },
      { value: 'value', label: valueLabel },
      ...(src.mode.value === 'paste' ? src.columns.value.map(c => ({ value: `col:${c.index}` as const, label: c.label })) : []),
    ]
  })

  function textFor(r: ReadyRow, source: LineSource): string {
    if (source === 'none') return ''
    if (source === 'value') return (isBarcode.value ? r.normalized : r.value).replace(/\s+/g, ' ').trim()
    if (src.mode.value !== 'paste') return ''
    const col = Number(source.slice(4))
    return (src.table.value.rows[r.line - 1]?.[col] ?? '').replace(/\s+/g, ' ').trim()
  }

  const items = computed<LabelItem[]>(() => src.ready.value.map(r => ({
    key: String(r.index), line: r.line, normalized: r.normalized, texts: lineSources.value.map(s => textFor(r, s)),
  })))

  /* ---------- 字型與量字 ---------- */

  const measure = shallowRef<MeasureText>(cachedMeasure(estimateMeasure))
  /** null：還沒偵測（預渲染或沒有 canvas） */
  const installedFonts = ref<Record<PrintFontId, boolean> | null>(null)
  const font = computed(() => printFont(fontId.value))
  const textStyle = computed<TextStyle>(() => ({ family: font.value.stack, firstWeight: 700, weight: 400 }))
  const missingFont = computed(() => (installedFonts.value && !installedFonts.value[fontId.value] ? font.value : null))

  /* ---------- 碼：同一個內容只編一次 ---------- */

  const codeCache = new Map<string, CodeInfo | null>()
  function codeInfo(normalized: string): CodeInfo | null {
    const sym = src.symbology.value
    const key = `${sym}\u0000${src.ec.value}\u0000${normalized}`
    if (codeCache.has(key)) return codeCache.get(key)!
    if (codeCache.size > 6000) codeCache.clear()
    let info: CodeInfo | null = null
    if (sym === 'qr') {
      const m = makeQrMatrix(normalized, src.ec.value)
      if (m) info = { code: { kind: 'qr', modules: qrLabelModules(m) }, qr: qrLabelSvg(m), pattern: null }
    } else {
      try {
        const p = encodeBarcode(sym, normalized)
        info = { code: { kind: 'barcode', symbology: sym, modules: barcodeLabelModules(p), hri: p.text }, qr: null, pattern: p }
      } catch { /* 檢查過的列不會走到這裡 */ }
    }
    codeCache.set(key, info)
    return info
  }

  /* ---------- 排版 ---------- */

  const totalSlots = computed(() => slotCount(items.value.length, placement.value.startCell, placement.value.copies))
  const tooManyCells = computed(() => totalSlots.value > LABEL_MAX_CELLS)
  const placed = computed(() => (grid.value && !tooManyCells.value
    ? placeLabels(items.value, grid.value, { ...placement.value, offset: offset.value })
    : []))
  const sheetTotal = computed(() => placed.value.length)

  const blankCell = (key: string, rect: Rect, index: number): RenderCell => ({
    key, index, rect, box: { x: 0, y: 0, w: rect.w, h: rect.h }, blank: true, blocked: null, line: null, code: null, lines: [],
  })
  const BLOCKED_LABEL: Partial<Record<CellIssue['kind'], string>> = {
    'no-room': '放不下碼，不會印',
    'barcode-narrow': '條碼太窄，不會印',
    'barcode-short': '條碼太矮，不會印',
    'qr-tiny': 'QR Code 太小，不會印',
  }

  type ProblemKind = CellIssue['kind'] | 'truncated'
  const rendered = computed(() => {
    const pages: RenderPage[] = []
    const problems = new Map<ProblemKind, { lines: Set<number>; values: number[] }>()
    const g = grid.value
    if (!g) return { pages, problems }
    if (!placed.value.length) {
      // 還沒有清單：畫一張空的格子，讓人先看清楚型號的樣子（不能列印標籤，但可以印對位測試頁）
      pages.push({ key: 'empty', cells: testPageCells(g, offset.value).map((rect, i) => blankCell(`empty-${i}`, rect, i)) })
      return { pages, problems }
    }
    const note = (kind: ProblemKind, line: number, value?: number) => {
      const entry = problems.get(kind) ?? { lines: new Set<number>(), values: [] }
      entry.lines.add(line)
      if (value !== undefined) entry.values.push(value)
      problems.set(kind, entry)
    }
    const cache = new Map<string, { layout: CellLayout; code: RenderCode | null }>()
    placed.value.forEach((page, p) => {
      pages.push({
        key: `p${p}`,
        cells: page.cells.map((c) => {
          const key = `p${p}-${c.index}`
          if (!c.item) return blankCell(key, c.rect, c.index)
          const { box } = contentBox(c.rect, avoidEdge.value)
          const cacheKey = `${c.item.key}\u0000${box.w}\u0000${box.h}`
          let entry = cache.get(cacheKey)
          if (!entry) {
            const info = codeInfo(c.item.normalized)
            const layout: CellLayout = info
              ? layoutCell(box, info.code, c.item.texts, textStyle.value, measure.value)
              : { code: null, moduleMm: 0, lines: [], issue: { kind: 'no-room' }, truncated: false }
            let code: RenderCode | null = null
            if (info && layout.code) {
              const parts = info.qr ?? barcodeLabelSvg(info.pattern!, layout.moduleMm, layout.code.h)
              code = { kind: info.code.kind, rect: layout.code, ...parts }
            }
            entry = { layout, code }
            cache.set(cacheKey, entry)
            const issue = layout.issue
            if (issue) {
              const value = 'xMm' in issue ? issue.xMm : 'moduleMm' in issue ? issue.moduleMm : 'barMm' in issue ? issue.barMm : undefined
              note(issue.kind, c.item.line, value)
            }
            if (layout.truncated) note('truncated', c.item.line)
          }
          const blocked = isBlocking(entry.layout.issue) ? BLOCKED_LABEL[entry.layout.issue!.kind] ?? '不會印' : null
          return {
            key, index: c.index, rect: c.rect, blank: false, blocked, line: c.item.line,
            box: { x: box.x - c.rect.x, y: box.y - c.rect.y, w: box.w, h: box.h },
            code: blocked ? null : entry.code, lines: blocked ? [] : entry.layout.lines,
          }
        }),
      })
    })
    return { pages, problems }
  })

  const testCells = computed(() => (grid.value ? testPageCells(grid.value, offset.value) : []))
  const edgeCount = computed(() => (grid.value ? edgeCellCount(grid.value, offset.value) : 0))

  /* ---------- 提醒與擋下的原因 ---------- */

  const notices = computed<LabelNotice[]>(() => {
    const out: LabelNotice[] = []
    const unit = src.lineUnit.value
    const sym = src.symbology.value
    const symLabel = SYMBOLOGY_LABEL[sym]
    const p = rendered.value.problems
    const lines = (kind: ProblemKind) => [...(p.get(kind)?.lines ?? [])]
    const min = (kind: ProblemKind) => Math.min(...(p.get(kind)?.values ?? [0]))
    const fmt = (n: number) => n.toFixed(2).replace(/0$/, '')

    if (p.has('no-room')) {
      out.push({ id: 'no-room', level: 'block', text: `${whichLines(lines('no-room'), unit)}：格子扣掉四周的留白之後放不下碼。請選大一點的標籤紙，或減少每格的文字。` })
    }
    if (p.has('barcode-narrow')) {
      const minMm = sym === 'qr' ? 0 : BARCODE_MIN_X_MM[sym]
      const why = sym === 'ean13' || sym === 'ean8' ? '（標準尺寸的 80%）' : ''
      out.push({ id: 'barcode-narrow', level: 'block', text: `${whichLines(lines('barcode-narrow'), unit)}：條碼在這個格子裡太窄，最細的線只有 ${fmt(min('barcode-narrow'))} mm，${symLabel} 至少要 ${minMm} mm${why}才掃得到。請選寬一點的標籤紙、縮短內容，或改用 QR Code。` })
    }
    if (p.has('barcode-short')) {
      out.push({ id: 'barcode-short', level: 'block', text: `${whichLines(lines('barcode-short'), unit)}：條碼太矮，掃描時要對得很準。請減少每格的文字行數，或選高一點的標籤紙。` })
    }
    if (p.has('qr-tiny')) {
      out.push({ id: 'qr-tiny', level: 'block', text: `${whichLines(lines('qr-tiny'), unit)}：QR Code 的小方塊只有 ${fmt(min('qr-tiny'))} mm，印出來手機很難掃。請縮短內容、把耐髒程度調低、減少每格的文字，或選大一點的標籤紙。` })
    }
    if (p.has('barcode-thin')) {
      // 只有 BARCODE_WARN_X_MM 有值的碼制（Code 128、Code 39、ITF-14）才會有 barcode-thin
      const warnMm = sym === 'qr' ? undefined : BARCODE_WARN_X_MM[sym]
      const advice = sym === 'itf14'
        ? `外箱給物流掃描時建議 ${warnMm} mm 以上（選 2 欄的大標籤）`
        : `建議 ${warnMm} mm 以上，比較舊的掃描槍可能要多掃幾次`
      out.push({ id: 'barcode-thin', level: 'warn', text: `${whichLines(lines('barcode-thin'), unit)}：條碼最細的線只有 ${fmt(min('barcode-thin'))} mm，${advice}。整批印之前請先實際掃一張。` })
    }
    if (p.has('qr-small')) {
      out.push({ id: 'qr-small', level: 'warn', text: `${whichLines(lines('qr-small'), unit)}：QR Code 的小方塊只有 ${fmt(min('qr-small'))} mm，手機要靠近一點才掃得到。整批印之前請先實際掃一張。` })
    }
    if (p.has('truncated')) {
      out.push({ id: 'truncated', level: 'warn', text: `${whichLines(lines('truncated'), unit)}的字太長，縮到最小字級（${MIN_LABEL_FONT_PT} pt）還放不下，已截斷，標籤上會以「…」結尾。可以改短、少印一行，或選寬一點的標籤紙。` })
    }
    if (edgeCount.value) {
      out.push(avoidEdge.value
        ? { id: 'edge', level: 'info', text: `這個型號有 ${edgeCount.value} 格貼近紙邊，多數印表機印不到紙邊 ${PRINTER_EDGE_RANGE}：這幾格的碼與字已經自動往內縮，避開印不到的範圍。` }
        : { id: 'edge', level: 'warn', text: `這個型號有 ${edgeCount.value} 格貼近紙邊，多數印表機印不到紙邊 ${PRINTER_EDGE_RANGE}，碼與字可能被切掉。印表機能無邊界列印時才關掉內縮。` })
    }
    return out
  })

  const blockingNotice = computed(() => notices.value.some(n => n.level === 'block'))

  /** 不能列印標籤的原因（照優先順序第一個）；null 表示可以列印 */
  const printBlocker = computed<string | null>(() => {
    if (!gridResult.value.ok) return gridResult.value.error
    if (src.blocker.value) return src.blocker.value
    if (tooManyCells.value) {
      return `一次最多印 ${formatCount(LABEL_MAX_CELLS)} 格，目前要 ${formatCount(totalSlots.value)} 格（含留白的格子與每筆的份數），請分批列印。`
    }
    if (blockingNotice.value) return '有些標籤印出來會掃不到，請先照上面的說明調整。'
    return null
  })
  /** 對位測試頁只要格子合理就能印，不需要清單 */
  const testBlocker = computed<string | null>(() => (gridResult.value.ok ? null : gridResult.value.error))
  const activeBlocker = computed(() => (target.value === 'labels' ? printBlocker.value : testBlocker.value))
  const sheetsToPrint = computed(() => (target.value === 'test' ? 1 : sheetTotal.value))

  /* ---------- 列印 ---------- */

  /** 開瀏覽器的列印視窗；印標籤時先送一次 GA（筆數級距、碼制、輸出方式 label） */
  function print(): void {
    if (activeBlocker.value || typeof window === 'undefined') return
    if (target.value === 'labels') trackBatchDownload(items.value.length, src.symbology.value, 'label')
    window.print()
  }

  /* ---------- 掛載後：實際量字、偵測字型、讀回記住的位移 ---------- */

  onMounted(() => {
    const m = canvasMeasure()
    if (m) {
      measure.value = cachedMeasure(m)
      installedFonts.value = Object.fromEntries(PRINT_FONTS.map(f => [f.id, detectFont(f, m)])) as Record<PrintFontId, boolean>
    }
    const saved = loadPrinterOffset()
    if (saved) {
      offsetX.value = saved.x
      offsetY.value = saved.y
      rememberOffset.value = true
    }
  })

  // 勾選時記住（之後改位移也跟著存），取消就刪掉。只存兩個數字。
  watch([rememberOffset, offset], ([remember, o], [wasRemembering]) => {
    if (remember) savePrinterOffset(o.xMm, o.yMm)
    else if (wasRemembering) forgetPrinterOffset()
  })

  return {
    sheets: LABEL_SHEETS,
    sheetId, custom, gridResult, grid, perSheet, sheetName,
    startCell, copies, placement, maxCopies: LABEL_MAX_COPIES,
    lineSources, lineOptions, fontId, font, missingFont, installedFonts,
    avoidEdge, edgeCount, offsetX, offsetY, offset, rememberOffset,
    target, showAllSheets, items, rendered, testCells, sheetTotal, sheetsToPrint, totalSlots,
    notices, printBlocker, testBlocker, activeBlocker, print,
  }
}

export type BatchLabels = ReturnType<typeof useBatchLabels>
