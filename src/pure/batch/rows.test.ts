import { describe, it, expect } from 'vitest'
import { parseClipboardTable } from './table'
import {
  rowsFromTable, rowsFromLines, rowsFromSequence, checkRows, findDuplicates, assignFileNames,
  CAPACITY_MESSAGE, EMPTY_ROW_MESSAGE, type ReadyRow, type FailedRow, type CheckedRow,
} from './rows'

const ready = (rows: CheckedRow[]) => rows.filter((r): r is ReadyRow => r.ok)
const failed = (rows: CheckedRow[]) => rows.filter((r): r is FailedRow => !r.ok)

describe('rowsFromTable：從 Excel 貼上', () => {
  const table = parseClipboardTable([
    '財產編號\t名稱\t網址',
    'TP-0001\t筆電\thttps://example.com/1',
    '',
    'TP-0002\t投影機\t',
    '\t\t',
    '  TP-0003  \t 印表機 \thttps://example.com/3',
  ].join('\r\n'))

  it('略過欄名列與空白列，第幾列照試算表的位置算', () => {
    const rows = rowsFromTable(table, { headerIndex: 0, content: 0, name: -1 })
    expect(rows).toEqual([
      { line: 2, value: 'TP-0001', name: null },
      { line: 4, value: 'TP-0002', name: null },
      { line: 6, value: 'TP-0003', name: null },
    ])
  })

  it('另外選檔名欄時帶上那一欄（去頭尾空白）；檔名欄等於內容欄時不另外帶', () => {
    expect(rowsFromTable(table, { headerIndex: 0, content: 2, name: 1 }).map(r => r.name)).toEqual(['筆電', '投影機', '印表機'])
    expect(rowsFromTable(table, { headerIndex: 0, content: 0, name: 0 }).map(r => r.name)).toEqual([null, null, null])
  })

  it('內容欄空白、其他欄有字的列照樣收，檢查時標成空的', () => {
    const rows = rowsFromTable(table, { headerIndex: 0, content: 2, name: 0 })
    expect(rows.map(r => r.value)).toEqual(['https://example.com/1', '', 'https://example.com/3'])
    const checked = checkRows(rows, { symbology: 'qr', ec: 'M', template: '' })
    expect(failed(checked)).toMatchObject([{ line: 4, code: 'empty', error: EMPTY_ROW_MESSAGE }])
  })

  it('沒有欄名列時第一列也是資料', () => {
    expect(rowsFromTable(parseClipboardTable('A\nB'), { headerIndex: -1, content: 0, name: -1 }).map(r => r.line)).toEqual([1, 2])
  })
})

describe('rowsFromLines：每行一筆', () => {
  it('空白行略過，行號照原本的位置，去頭尾空白', () => {
    expect(rowsFromLines('a\r\n\r\n  b  \n\n\nc\n')).toEqual([
      { line: 1, value: 'a', name: null },
      { line: 3, value: 'b', name: null },
      { line: 6, value: 'c', name: null },
    ])
    expect(rowsFromLines('')).toEqual([])
  })
})

describe('checkRows：逐列檢查', () => {
  it('QR Code：只有太長會錯；耐髒程度越高越容易超過', () => {
    const long = 'a'.repeat(2400)
    const rows = rowsFromLines(`https://example.com/1\n${long}`)
    expect(failed(checkRows(rows, { symbology: 'qr', ec: 'L', template: '' }))).toHaveLength(0)
    const h = checkRows(rows, { symbology: 'qr', ec: 'H', template: '' })
    expect(failed(h)).toMatchObject([{ line: 2, code: 'capacity', error: CAPACITY_MESSAGE }])
  })

  it('QR Code：中文以 UTF-8 計算容量（一個字 3 個位元組）', () => {
    // H 等級版本 40 最多 1,273 個位元組：424 個中文字是 1,272，425 個是 1,275
    const ok = checkRows(rowsFromLines('中'.repeat(424)), { symbology: 'qr', ec: 'H', template: '' })
    const bad = checkRows(rowsFromLines('中'.repeat(425)), { symbology: 'qr', ec: 'H', template: '' })
    expect(ok[0]!.ok).toBe(true)
    expect(bad[0]!.ok).toBe(false)
  })

  it('套範本之後才檢查，內容是代入後的網址', () => {
    const r = checkRows(rowsFromLines('TP 0001'), { symbology: 'qr', ec: 'M', template: 'https://example.com/a/{編號}' })
    expect(ready(r)[0]).toMatchObject({ value: 'TP 0001', content: 'https://example.com/a/TP%200001', normalized: 'https://example.com/a/TP%200001' })
  })

  it('EAN-13：12 位自動補檢查碼、13 位驗證、檢查碼不符寫出正確的那一位', () => {
    const r = checkRows(rowsFromLines('471008833123\n4710088331236\n4710088331237\n47100883'), { symbology: 'ean13', ec: 'M', template: '' })
    expect(ready(r).map(x => [x.normalized, x.appendedCheckDigit])).toEqual([['4710088331236', true], ['4710088331236', false]])
    const bad = failed(r)
    expect(bad.map(x => x.code)).toEqual(['checkDigit', 'length'])
    expect(bad[0]!.error).toContain('應該是 6')
  })

  it('Code 39：不支援的字元寫出是哪幾個；小寫自動轉大寫', () => {
    const r = checkRows(rowsFromLines('abc-12\nA#1\n中文'), { symbology: 'code39', ec: 'M', template: '' })
    expect(ready(r).map(x => x.normalized)).toEqual(['ABC-12'])
    expect(failed(r).map(x => x.code)).toEqual(['charset', 'charset'])
    expect(failed(r)[0]!.error).toContain('「#」')
  })

  it('Code 128 與 ITF-14', () => {
    expect(checkRows(rowsFromLines('ABC-123\n中'), { symbology: 'code128', ec: 'M', template: '' }).map(r => r.ok)).toEqual([true, false])
    expect(ready(checkRows(rowsFromLines('1540014128876'), { symbology: 'itf14', ec: 'M', template: '' }))[0]!.normalized).toBe('15400141288763')
  })

  it('index 是第幾筆資料（流水號用），錯誤列也佔一個', () => {
    const r = checkRows(rowsFromLines('1\nx\n3'), { symbology: 'ean8', ec: 'M', template: '' })
    expect(r.map(x => x.index)).toEqual([0, 1, 2])
  })
})

describe('findDuplicates：重複只提示', () => {
  it('以補過檢查碼的號碼比，列出所有出現的位置；錯誤列不算', () => {
    const r = checkRows(rowsFromLines('471008833123\nA\n4710088331236\nx\nx'), { symbology: 'ean13', ec: 'M', template: '' })
    expect(findDuplicates(r)).toEqual([{ value: '4710088331236', lines: [1, 3] }])
  })
})

describe('assignFileNames', () => {
  const qrRows = ready(checkRows(rowsFromSequence(['TP/001', 'TP/001', '', '...']), {
    symbology: 'qr', ec: 'M', template: 'https://example.com/{編號}',
  }))

  it('流水號照資料列的順序、補零到總筆數的位數', () => {
    expect(assignFileNames(qrRows, 1200, 'serial', 'qr', 'png')).toEqual(['0001.png', '0002.png', '0004.png'])
  })

  it('用內容當檔名：QR Code 用套範本前的值，清掉斜線、重名加 (2)，清完是空的改用流水號', () => {
    expect(assignFileNames(qrRows, 4, 'value', 'qr', 'svg')).toEqual(['TP_001.svg', 'TP_001 (2).svg', '004.svg'])
  })

  it('一維條碼用補過檢查碼的完整號碼', () => {
    const rows = ready(checkRows(rowsFromLines('471008833123'), { symbology: 'ean13', ec: 'M', template: '' }))
    expect(assignFileNames(rows, 1, 'value', 'ean13', 'png')).toEqual(['4710088331236.png'])
  })

  it('檔名欄', () => {
    const table = parseClipboardTable('編號\t名稱\nA1\t筆電\nA2\t\nA3\t筆電')
    const rows = ready(checkRows(rowsFromTable(table, { headerIndex: 0, content: 0, name: 1 }), { symbology: 'code128', ec: 'M', template: '' }))
    expect(assignFileNames(rows, 3, 'column', 'code128', 'png')).toEqual(['筆電.png', '002.png', '筆電 (2).png'])
  })
})
