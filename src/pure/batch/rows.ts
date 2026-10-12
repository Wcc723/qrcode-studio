/**
 * 批次的資料流程（純函式）：三種輸入 → 一列一列的值 → 套範本 → 逐列檢查 → 檔名。
 *
 *     const rows = rowsFromLines(text)                       // 或 rowsFromTable、rowsFromSequence
 *     const checked = checkRows(rows, { symbology: 'ean13', ec: 'M', template: '' })
 *     const ready = checked.filter(r => r.ok)
 *     const names = assignFileNames(ready, rows.length, 'value', 'ean13', 'png')
 *
 * 錯誤訊息直接給畫面用：一維條碼沿用 validateBarcode（位數、可用字元、檢查碼），QR Code 只會有「太長」。
 */
import type { ErrorCorrectionLevel } from '@/types'
import { validateBarcode, type BarcodeErrorCode, type BarcodeSymbology } from '../validateBarcode'
import { toQrByteString } from '../qrByteString'
import { qrVersion } from '../qrGeometry'
import { applyTemplate } from './template'
import { isBlankRow, type ParsedTable } from './table'
import { dedupeName, sanitizeBaseName, serialName } from './filename'

export type BatchSymbology = 'qr' | BarcodeSymbology

/**
 * 單次上限。2026-10 在桌機實測 2,000 張「網址＋編號」的 QR Code：1000 像素的 PNG 在 Chromium 約 8 秒、
 * WebKit 約 15 秒，ZIP 約 45 MB；SVG 兩邊都在 2 秒內。1500 像素的 PNG 大約再慢一倍、ZIP 約 90 MB，
 * 手機上記憶體開始吃緊，所以單次停在這裡，再多就請使用者分批。
 */
export const BATCH_MAX_ROWS = 2000

export interface SourceRow {
  /** 使用者看到的位置（1 起算）：貼上的第幾列、第幾行，或連號的第幾筆 */
  line: number
  /** 這一列的值（內容欄、這一行、連號），去掉頭尾空白 */
  value: string
  /** 另外指定的檔名欄的值；沒有檔名欄時是 null */
  name: string | null
}

export interface TableColumns {
  /** 欄名列的索引；沒有欄名列是 -1 */
  headerIndex: number
  /** 內容欄（0 起算） */
  content: number
  /** 檔名欄（0 起算）；-1 或等於內容欄時沒有另外的檔名欄 */
  name: number
}

/** 從 Excel 貼上：略過欄名列與空白列；內容欄空白、其他欄有字的列照樣收進來，檢查時標成「空的」。 */
export function rowsFromTable(table: Pick<ParsedTable, 'rows'>, cols: TableColumns): SourceRow[] {
  const out: SourceRow[] = []
  table.rows.forEach((cells, i) => {
    if (i === cols.headerIndex || isBlankRow(cells)) return
    const separateName = cols.name >= 0 && cols.name !== cols.content
    out.push({
      line: i + 1,
      value: (cells[cols.content] ?? '').trim(),
      name: separateName ? (cells[cols.name] ?? '').trim() : null,
    })
  })
  return out
}

/** 每行一筆：空白行略過，行號照原本的位置算。 */
export function rowsFromLines(text: string): SourceRow[] {
  const out: SourceRow[] = []
  text.replace(/^﻿/, '').split(/\r\n|\r|\n/).forEach((line, i) => {
    const value = line.trim()
    if (value) out.push({ line: i + 1, value, name: null })
  })
  return out
}

/** 連號：第幾筆就是第幾個值。 */
export function rowsFromSequence(values: readonly string[]): SourceRow[] {
  return values.map((value, i) => ({ line: i + 1, value, name: null }))
}

export type RowErrorCode = 'empty' | 'capacity' | BarcodeErrorCode

interface RowBase extends SourceRow {
  /** 在全部資料列裡是第幾筆（0 起算），流水號用 */
  index: number
  /** 套過範本、真正要做成碼的內容 */
  content: string
}
export interface ReadyRow extends RowBase {
  ok: true
  /** 送去產生的字串：一維條碼是補過檢查碼、去掉空白與連字號的號碼，QR Code 就是內容本身 */
  normalized: string
  /** 檢查碼是不是工具補上的 */
  appendedCheckDigit: boolean
}
export interface FailedRow extends RowBase {
  ok: false
  code: RowErrorCode
  error: string
}
export type CheckedRow = ReadyRow | FailedRow

export interface CheckOptions {
  symbology: BatchSymbology
  ec: ErrorCorrectionLevel
  /** 先通過 checkTemplate 的範本；留白表示不套 */
  template: string
}

export const EMPTY_ROW_MESSAGE = '這一列的內容是空的。'
export const CAPACITY_MESSAGE = '內容太長，超過 QR Code 能放的上限。請縮短內容，或把耐髒程度調低。'

/** 逐列檢查。檢查只看內容本身，重複的值另外用 findDuplicates 提示、不算錯。 */
export function checkRows(rows: readonly SourceRow[], opts: CheckOptions): CheckedRow[] {
  return rows.map((row, index): CheckedRow => {
    if (!row.value) return { ...row, index, content: '', ok: false, code: 'empty', error: EMPTY_ROW_MESSAGE }
    const content = applyTemplate(opts.template, row.value)
    if (opts.symbology === 'qr') {
      if (qrVersion(toQrByteString(content), opts.ec) === null) {
        return { ...row, index, content, ok: false, code: 'capacity', error: CAPACITY_MESSAGE }
      }
      return { ...row, index, content, ok: true, normalized: content, appendedCheckDigit: false }
    }
    const v = validateBarcode(opts.symbology, content)
    if (!v.ok) {
      const code = v.code ?? 'charset'
      return { ...row, index, content, ok: false, code, error: code === 'empty' ? EMPTY_ROW_MESSAGE : v.error! }
    }
    return { ...row, index, content, ok: true, normalized: v.normalized!, appendedCheckDigit: !!v.appendedCheckDigit }
  })
}

export interface Duplicate {
  /** 重複的內容（一維條碼是補過檢查碼之後的號碼） */
  value: string
  /** 出現在哪幾列 */
  lines: number[]
}

/** 內容一樣的列（只看可以產生的列）：提示但不擋，有時候本來就要印好幾張一樣的。 */
export function findDuplicates(rows: readonly CheckedRow[]): Duplicate[] {
  const seen = new Map<string, number[]>()
  for (const r of rows) {
    if (!r.ok) continue
    const lines = seen.get(r.normalized)
    if (lines) lines.push(r.line)
    else seen.set(r.normalized, [r.line])
  }
  return [...seen.entries()].filter(([, lines]) => lines.length > 1).map(([value, lines]) => ({ value, lines }))
}

/**
 * 檔名從哪裡來：
 * - serial：流水號（001、002…，照資料列的順序，略過的錯誤列也佔一個號碼，跟清單對得起來）
 * - value：內容本身。一維條碼用補過檢查碼的完整號碼；QR Code 用套範本之前的值（例如編號，不是整串網址）
 * - column：另外指定的檔名欄
 * 清完是空的就退回流水號；同名的加「 (2)」。
 */
export type NameSource = 'serial' | 'value' | 'column'

export function assignFileNames(
  rows: readonly ReadyRow[], total: number, source: NameSource, symbology: BatchSymbology, ext: 'svg' | 'png',
): string[] {
  const taken = new Set<string>()
  return rows.map((r) => {
    const raw = source === 'serial' ? '' : source === 'column' ? (r.name ?? '') : symbology === 'qr' ? r.value : r.normalized
    const base = sanitizeBaseName(raw) || serialName(r.index, total)
    return dedupeName(`${base}.${ext}`, taken)
  })
}
