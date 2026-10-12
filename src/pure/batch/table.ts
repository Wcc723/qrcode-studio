/**
 * 從 Excel、Google 試算表或 LibreOffice 複製一塊儲存格，貼進文字框之後變成的純文字，解析回列與欄。
 * 純函式，不碰 DOM；清單只在瀏覽器記憶體裡。
 *
 * 剪貼簿的規則（Excel 的 text/plain；Google 試算表與 LibreOffice 相同）：
 * - 欄用 Tab 分開，列用換行分開。Windows 是 CRLF，Mac 與網頁是 LF，也照收單獨的 CR
 * - 儲存格內有換行（Alt+Enter）或 Tab 時，整格用雙引號包起來，格內的雙引號寫成兩個（`""`）
 * - 選取範圍的最後一列後面還有一個換行：複製三格得到 `a\r\nb\r\nc\r\n`，這是三列不是四列，
 *   所以結尾的換行只去掉一個；再多的就是使用者真的留下的空白列
 * - 開頭是雙引號、卻找不到「雙引號接著 Tab 或換行或結尾」的格子，照字面收（例如 `"5" 吋`）
 *
 * 空白列保留、位置不動；`rowStartLines` 是這一列在文字框裡從第幾行開始（引號內換行的儲存格會佔好幾行），
 * 錯誤訊息的「第幾列」用它對回使用者看到的位置。
 */

export interface ParsedTable {
  /** 每一列的儲存格；空白列是 `['']` */
  rows: string[][]
  /** 實際的列數（含空白列、含超過上限沒解析的部分） */
  totalRows: number
  /** 有沒有因為 `maxRows` 被截掉 */
  truncated: boolean
  /** 最寬那一列的欄數 */
  columnCount: number
  /** 每一列在原始文字的第幾行開始（0 起算） */
  rowStartLines: number[]
}

/**
 * 從 `start`（一個雙引號）開始讀一個加引號的儲存格。成功時回傳內容與結束位置（指向結尾引號之後，
 * 那裡一定是 Tab、換行或文字結尾）；不成立時回傳 null，呼叫端改成照字面讀。
 */
function readQuoted(text: string, start: number): { value: string; end: number } | null {
  let value = ''
  let i = start + 1
  while (i < text.length) {
    const char = text[i]
    if (char === '"') {
      if (text[i + 1] === '"') {
        value += '"'
        i += 2
        continue
      }
      const next = text[i + 1]
      if (next === undefined || next === '\t' || next === '\n') return { value, end: i + 1 }
      return null
    }
    value += char
    i += 1
  }
  return null
}

function nextDelimiter(text: string, from: number): number {
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === '\t' || text[i] === '\n') return i
  }
  return text.length
}

/** 解析貼上的表格。`maxRows` 以後的列只計數不解析（`truncated` 為 true）。 */
export function parseClipboardTable(input: string, maxRows = Number.POSITIVE_INFINITY): ParsedTable {
  const withoutBom = input.startsWith('﻿') ? input.slice(1) : input
  const normalized = withoutBom.replace(/\r\n?/g, '\n')
  if (normalized === '') return { rows: [], totalRows: 0, truncated: false, columnCount: 0, rowStartLines: [] }
  // 複製範圍結尾的那一個換行不是一列
  const text = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized

  const rows: string[][] = []
  const rowStartLines: number[] = []
  let totalRows = 0
  let line = 0
  let row: string[] = []
  let rowStart = 0
  let i = 0
  const pushRow = () => {
    totalRows += 1
    if (rows.length < maxRows) {
      rows.push(row)
      rowStartLines.push(rowStart)
    }
    row = []
  }

  // 逐格讀：每一格在 Tab（下一格）、換行（下一列）或結尾停下
  for (;;) {
    let value: string
    const quoted = text[i] === '"' ? readQuoted(text, i) : null
    if (quoted) {
      value = quoted.value
      line += (value.match(/\n/g) ?? []).length
      i = quoted.end
    } else {
      const stop = nextDelimiter(text, i)
      value = text.slice(i, stop)
      i = stop
    }
    row.push(value)
    if (i >= text.length) {
      pushRow()
      break
    }
    if (text[i] === '\t') {
      i += 1
      continue
    }
    // 換行：這一列結束
    i += 1
    line += 1
    pushRow()
    rowStart = line
  }

  const columnCount = rows.reduce((max, cells) => Math.max(max, cells.length), 0)
  return { rows, totalRows, truncated: totalRows > rows.length, columnCount, rowStartLines }
}

/** 整列都是空白（含只有空白字元的格子） */
export function isBlankRow(cells: readonly string[]): boolean {
  return cells.every(cell => cell.trim() === '')
}

/** Excel 的欄名：0 → A、25 → Z、26 → AA */
export function columnLetter(index: number): string {
  let n = index + 1
  let out = ''
  while (n > 0) {
    const r = (n - 1) % 26
    out = String.fromCharCode(65 + r) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

const URLISH = /^[a-z][a-z0-9+.-]*:\/\//i
/** 編號、條碼、網址這類「機器讀的值」：網址，或只有英數與 - _ . / : # + 而且至少一個數字 */
function looksStructured(value: string): boolean {
  const v = value.trim()
  return URLISH.test(v) || (/^[A-Za-z0-9\-_./:#+]+$/.test(v) && /\d/.test(v))
}

/**
 * 一看就是欄名的字。只用來判斷第一列是不是欄名。
 * 「財產編號」「商品名稱」「購置日期」這類可以帶前綴；「單位」「部門」「位置」只認整格：
 * 「總務單位」「資訊部門」也可能是資料列裡的值。
 */
const HEADER_WORDS = /^(?:.{0,6}(?:編號|代號|代碼|序號|號碼|編碼|料號|品號|貨號|條碼|名稱|品名|網址|連結|日期|檔名)|品項|內容|備註|說明|保管人|保管單位|使用單位|單位|部門|位置|儲位|地點|數量|價格|規格|類別|url|link|sku|id|no\.?|name|title|code|barcode|item|asset|content|file ?name)$/i

export interface HeaderGuess {
  /** 欄名列的索引（第一個不是空白的列）；沒有欄名列是 -1 */
  index: number
}

/**
 * 第一個不是空白的列是不是欄名：
 * 1. 有一格是認得的欄名（編號、名稱、網址、SKU…）
 * 2. 或某一欄底下的值八成以上是編號或網址，第一列那一格卻是沒有數字、不是網址的文字（「Link」「掃描後開啟」）
 * 只有一列資料時不算有欄名（那一列就是唯一的一筆）。
 */
export function detectHeaderRow(rows: readonly string[][]): HeaderGuess {
  const first = rows.findIndex(cells => !isBlankRow(cells))
  if (first === -1) return { index: -1 }
  const body = rows.slice(first + 1).filter(cells => !isBlankRow(cells))
  if (body.length === 0) return { index: -1 }
  const head = rows[first]!.map(c => c.trim())
  if (head.some(cell => cell.length <= 20 && HEADER_WORDS.test(cell))) return { index: first }
  for (let column = 0; column < head.length; column += 1) {
    const cell = head[column]!
    if (!cell || /\d/.test(cell) || URLISH.test(cell) || cell.length > 20) continue
    const values = body.map(cells => (cells[column] ?? '').trim()).filter(Boolean)
    if (values.length && values.filter(looksStructured).length / values.length >= 0.8) return { index: first }
  }
  return { index: -1 }
}

const CONTENT_HEADER = /網址|連結|內容|url|link|content|qr/i
const NAME_HEADER = /編號|代號|代碼|序號|號碼|編碼|料號|品號|貨號|檔名|sku|^id$|^no\.?$|code|file ?name/i

export interface ColumnGuess {
  /** 內容欄（0 起算） */
  content: number
  /** 檔名欄（0 起算）；等於內容欄時表示用內容本身當檔名，-1 表示用流水號 */
  name: number
}

/**
 * 猜「內容欄」與「檔名欄」。畫面上一律讓使用者用下拉選單改，這裡只給預設值：
 * - 內容欄：欄名像「網址、連結、內容」的那一欄；沒有欄名時，值多半是網址的那一欄；都沒有就第一欄
 * - 檔名欄：欄名像「編號、代號、SKU」的另一欄；內容是網址時改用另一欄（網址當檔名很長又難認）；
 *   只有一欄而且內容不是網址時就用內容本身，否則用流水號
 */
export function guessColumns(rows: readonly string[][], headerIndex: number): ColumnGuess {
  const columnCount = rows.reduce((max, cells) => Math.max(max, cells.length), 0)
  if (columnCount === 0) return { content: 0, name: -1 }
  const header = headerIndex >= 0 ? rows[headerIndex]!.map(c => c.trim()) : null
  const body = rows.filter((cells, index) => index !== headerIndex && !isBlankRow(cells))
  const urlRatio = (column: number) => {
    const values = body.map(cells => (cells[column] ?? '').trim()).filter(Boolean)
    return values.length ? values.filter(v => URLISH.test(v)).length / values.length : 0
  }
  const columns = Array.from({ length: columnCount }, (_, i) => i)

  let content = header ? columns.find(i => CONTENT_HEADER.test(header[i] ?? '')) : undefined
  content ??= columns.find(i => urlRatio(i) >= 0.8)
  content ??= 0

  const others = columns.filter(i => i !== content)
  let name = header ? others.find(i => NAME_HEADER.test(header[i] ?? '')) : undefined
  const contentIsUrl = urlRatio(content) >= 0.5
  if (name === undefined && contentIsUrl) name = others.find(i => urlRatio(i) < 0.5)
  if (name === undefined) name = contentIsUrl ? -1 : content
  return { content, name }
}
