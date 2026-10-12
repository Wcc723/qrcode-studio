/**
 * 批次產生頁的狀態與推導：三種輸入、範本、碼制、逐列檢查、檔名、預覽、匯出 ZIP。
 *
 * 清單只放在這裡的 ref 裡（記憶體），不寫進網址、Cookie、localStorage、sessionStorage、IndexedDB，
 * 也不進 GA；GA 只在下載成功後送筆數級距、碼制、輸出格式（src/utils/batch-analytics.ts）。
 * src/batch-gates.test.ts 會掃原始碼擋下這些出口。
 */
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import type { ErrorCorrectionLevel } from '@/types'
import { detectHeaderRow, guessColumns, isBlankRow, parseClipboardTable } from '@/pure/batch/table'
import { buildSequence, formatCount, sequencePreview, type SequenceSpec } from '@/pure/batch/sequence'
import { checkTemplate } from '@/pure/batch/template'
import {
  BATCH_MAX_ROWS, assignFileNames, checkRows, findDuplicates, rowsFromLines, rowsFromSequence, rowsFromTable,
  type BatchSymbology, type FailedRow, type NameSource, type ReadyRow, type SourceRow,
} from '@/pure/batch/rows'
import { makeQrMatrix, qrPathData } from '@/pure/batch/qrMatrix'
import { QUIET_ZONE_MODULES } from '@/pure/qrGeometry'
import { barcodeGeometry, encodeBarcode, type BarcodeGeometry } from '@/pure/encodeBarcode'
import { exportZip } from '@/utils/batch-export'
import { saveBlob } from '@/utils/save-blob'
import { trackBatchDownload } from '@/utils/batch-analytics'

export type InputMode = 'paste' | 'lines' | 'sequence'
export type OutputFormat = 'png' | 'svg'

/** 預覽只畫前幾格：清單再長，畫面上也只放這麼多個圖 */
export const PREVIEW_COUNT = 24
/** 有問題的列最多列出幾列，其餘只說還有幾列 */
export const ISSUE_LIST_LIMIT = 100

export type PreviewTile =
  | { key: string; line: number; name: string; content: string; kind: 'qr'; viewBox: string; d: string }
  | { key: string; line: number; name: string; content: string; kind: 'barcode'; g: BarcodeGeometry }

/** 一維條碼的矩形合成一段 path，預覽少一點 DOM 節點 */
export function rectsPath(rects: BarcodeGeometry['bars']): string {
  return rects.map(r => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`).join('')
}

export function useBatch() {
  const mode = ref<InputMode>('paste')
  const pasteText = ref('')
  const linesText = ref('')
  const seq = reactive<SequenceSpec>({ prefix: '', start: '1', until: 'count', count: '100', end: '', step: '1', pad: '4', suffix: '' })

  const hasHeader = ref(false)
  const contentCol = ref(0)
  const nameCol = ref(-1)
  const linesName = ref<'value' | 'serial'>('value')
  const seqName = ref<'value' | 'serial'>('value')

  const template = ref('')
  const symbology = ref<BatchSymbology>('qr')
  const ec = ref<ErrorCorrectionLevel>('M')
  const onError = ref<'block' | 'skip'>('block')
  const format = ref<OutputFormat>('png')
  const qrSize = ref(1000)
  const barcodeScale = ref(4)

  /* ---------- 從 Excel 貼上 ---------- */

  // 多解析一點：欄名列與空白列不算筆數，超過上限時還是要說得出「超過」
  const table = computed(() => parseClipboardTable(pasteText.value, BATCH_MAX_ROWS + 500))
  const firstRow = computed(() => table.value.rows.findIndex(cells => !isBlankRow(cells)))
  const headerIndex = computed(() => (hasHeader.value ? firstRow.value : -1))
  const headerCells = computed(() => (headerIndex.value >= 0 ? table.value.rows[headerIndex.value]! : null))

  // 貼上的內容換了才重新猜「第一列是不是欄名」：使用者自己改過勾選框之後，只改資料列不會蓋掉
  watch(() => detectHeaderRow(table.value.rows).index, (index) => { hasHeader.value = index >= 0 })
  // 欄數或欄名換了才重新猜內容欄與檔名欄，使用者改過的選擇在只改資料列時保留
  watch(
    () => `${table.value.columnCount}\u0000${headerIndex.value}\u0000${headerCells.value?.join('\t') ?? ''}`,
    () => {
      const guess = guessColumns(table.value.rows, headerIndex.value)
      contentCol.value = guess.content
      nameCol.value = guess.name
    },
  )

  /** 「第幾列」的說法跟著輸入方式：貼上是列、每行一筆是行、連號是第幾筆 */
  const lineUnit = computed(() => (mode.value === 'paste' ? '列' : mode.value === 'lines' ? '行' : '筆'))

  /* ---------- 三種輸入 → 一列一列的值 ---------- */

  const sequence = computed(() => buildSequence(seq, BATCH_MAX_ROWS))
  const sequenceShown = computed(() => (sequence.value.ok ? sequencePreview(sequence.value.values) : null))

  const sourceRows = computed<SourceRow[]>(() => {
    if (mode.value === 'paste') {
      return rowsFromTable(table.value, { headerIndex: headerIndex.value, content: contentCol.value, name: nameCol.value })
    }
    if (mode.value === 'lines') return rowsFromLines(linesText.value)
    return sequence.value.ok ? rowsFromSequence(sequence.value.values) : []
  })
  /** 貼上的列數超過解析上限時，實際比 sourceRows 還多 */
  const tooMany = computed(() =>
    sourceRows.value.length > BATCH_MAX_ROWS || (mode.value === 'paste' && table.value.truncated))
  /** 每一行裡有 Tab：看起來是從 Excel 貼了好幾欄進「每行一筆」 */
  const linesLookTabular = computed(() => mode.value === 'lines' && linesText.value.includes('\t'))

  /* ---------- 範本與逐列檢查 ---------- */

  const templateCheck = computed(() => checkTemplate(template.value))
  const checked = computed(() => {
    if (tooMany.value || !templateCheck.value.ok) return []
    return checkRows(sourceRows.value, { symbology: symbology.value, ec: ec.value, template: template.value })
  })
  const ready = computed(() => checked.value.filter((r): r is ReadyRow => r.ok))
  const failed = computed(() => checked.value.filter((r): r is FailedRow => !r.ok))
  const duplicates = computed(() => findDuplicates(checked.value))
  const appendedCount = computed(() => ready.value.filter(r => r.appendedCheckDigit).length)
  /** EAN-13 的 20 到 29 開頭是店內碼 */
  const hasStoreCodes = computed(() =>
    symbology.value === 'ean13' && ready.value.some(r => /^2\d/.test(r.normalized)))

  const nameSource = computed<NameSource>(() => {
    if (mode.value === 'paste') return nameCol.value < 0 ? 'serial' : nameCol.value === contentCol.value ? 'value' : 'column'
    return mode.value === 'lines' ? linesName.value : seqName.value
  })
  const fileNames = computed(() =>
    assignFileNames(ready.value, sourceRows.value.length, nameSource.value, symbology.value, format.value))

  /** 不能下載的原因（照優先順序第一個）；null 表示可以下載 */
  const blocker = computed<string | null>(() => {
    if (mode.value === 'sequence' && !sequence.value.ok) return sequence.value.error
    if (tooMany.value) {
      const n = mode.value === 'paste' && table.value.truncated ? `超過 ${formatCount(BATCH_MAX_ROWS)}` : formatCount(sourceRows.value.length)
      return `一次最多 ${formatCount(BATCH_MAX_ROWS)} 筆，目前有 ${n} 筆，請分批產生。`
    }
    if (!sourceRows.value.length) return mode.value === 'sequence' ? '請設定連號。' : '請先貼上清單。'
    if (!templateCheck.value.ok) return templateCheck.value.error
    if (failed.value.length && onError.value === 'block') {
      return `有 ${formatCount(failed.value.length)} ${lineUnit.value}要先修正，或改選「略過有問題的${lineUnit.value}」。`
    }
    if (!ready.value.length) return '沒有可以產生的列。'
    return null
  })

  /* ---------- 預覽：只畫前幾格 ---------- */

  const previewTiles = computed<PreviewTile[]>(() => {
    const tiles: PreviewTile[] = []
    const rows = ready.value.slice(0, PREVIEW_COUNT)
    rows.forEach((r, i) => {
      const base = { key: `${r.index}`, line: r.line, name: fileNames.value[i]!, content: r.normalized }
      if (symbology.value === 'qr') {
        const m = makeQrMatrix(r.normalized, ec.value)
        if (!m) return
        const full = m.size + QUIET_ZONE_MODULES * 2
        tiles.push({ ...base, kind: 'qr', viewBox: `0 0 ${full} ${full}`, d: qrPathData(m) })
        return
      }
      try {
        const g = barcodeGeometry(encodeBarcode(symbology.value, r.normalized), { moduleWidth: 2, height: 80, fontSize: 16 })
        tiles.push({ ...base, kind: 'barcode', g })
      } catch { /* 檢查過的列不會走到這裡；真的發生就不畫，也不要畫出壞圖 */ }
    })
    return tiles
  })

  /* ---------- 匯出 ---------- */

  const busy = ref(false)
  const progress = ref({ done: 0, total: 0 })
  const status = ref('')
  const exportError = ref('')
  let controller: AbortController | null = null

  // 設定一改，上一次下載的結果訊息就不再適用
  watch([sourceRows, symbology, format, template], () => { if (!busy.value) { status.value = ''; exportError.value = '' } })

  async function download() {
    if (busy.value || blocker.value) return
    const rows = ready.value
    const names = fileNames.value
    const items = rows.map((r, i) => ({ normalized: r.normalized, name: names[i]! }))
    const fmt = format.value
    const sym = symbology.value
    controller = new AbortController()
    busy.value = true
    status.value = ''
    exportError.value = ''
    progress.value = { done: 0, total: items.length }
    try {
      const blob = await exportZip(items, {
        format: fmt, symbology: sym, ec: ec.value, qrSize: qrSize.value, barcodeScale: barcodeScale.value,
        signal: controller.signal,
        onProgress: (done, total) => { progress.value = { done, total } },
      })
      saveBlob(blob, `${sym === 'qr' ? 'qrcode' : sym}-batch-${items.length}.zip`)
      const skipped = failed.value.length
      const unit = lineUnit.value
      status.value = `已下載 ${formatCount(items.length)} 張${fmt === 'png' ? ' PNG' : ' SVG'}${skipped ? `，略過 ${formatCount(skipped)} ${unit}有問題的` : ''}。`
      trackBatchDownload(items.length, sym, fmt)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') status.value = '已取消，沒有下載任何檔案。'
      else exportError.value = e instanceof Error && e.message ? e.message : '產生失敗，請減少筆數再試一次。'
    } finally {
      busy.value = false
      controller = null
    }
  }

  function cancel() {
    controller?.abort()
  }
  onBeforeUnmount(cancel)

  return {
    mode, lineUnit, pasteText, linesText, seq, hasHeader, contentCol, nameCol, linesName, seqName,
    template, symbology, ec, onError, format, qrSize, barcodeScale,
    table, headerIndex, headerCells, sequence, sequenceShown, sourceRows, tooMany, linesLookTabular,
    templateCheck, checked, ready, failed, duplicates, appendedCount, hasStoreCodes, fileNames, blocker,
    previewTiles, busy, progress, status, exportError, download, cancel,
  }
}
