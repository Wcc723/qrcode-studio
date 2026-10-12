import { describe, it, expect } from 'vitest'
import { parseClipboardTable, detectHeaderRow, guessColumns, columnLetter, isBlankRow } from './table'

describe('parseClipboardTable：Excel 貼上的文字還原成列與欄', () => {
  it('Tab 分欄、CRLF 分列，結尾那一個換行不算一列', () => {
    const t = parseClipboardTable('財產編號\t名稱\r\nTP-0001\t筆電\r\nTP-0002\t投影機\r\n')
    expect(t.rows).toEqual([['財產編號', '名稱'], ['TP-0001', '筆電'], ['TP-0002', '投影機']])
    expect(t.columnCount).toBe(2)
    expect(t.totalRows).toBe(3)
    expect(t.truncated).toBe(false)
  })

  it('LF、單獨的 CR 與 BOM 都吃得下', () => {
    expect(parseClipboardTable('﻿a\tb\nc\td').rows).toEqual([['a', 'b'], ['c', 'd']])
    expect(parseClipboardTable('a\rb\r').rows).toEqual([['a'], ['b']])
  })

  it('空白列保留在原位（第幾列才對得回試算表），多出來的結尾換行是使用者留的空白列', () => {
    const t = parseClipboardTable('a\n\nb\n\n')
    expect(t.rows).toEqual([['a'], [''], ['b'], ['']])
    expect(isBlankRow(t.rows[1]!)).toBe(true)
    expect(isBlankRow(['  ', '\t'.trim()])).toBe(true)
  })

  it('引號包住的儲存格：格內換行、Tab 與兩個雙引號', () => {
    const t = parseClipboardTable('"第一行\n第二行"\tx\n"有""引號""\t也有 Tab"\ty\n')
    expect(t.rows).toEqual([['第一行\n第二行', 'x'], ['有"引號"\t也有 Tab', 'y']])
  })

  it('開頭是雙引號但不成對的格子照字面收', () => {
    expect(parseClipboardTable('"5" 吋\t螢幕').rows).toEqual([['"5" 吋', '螢幕']])
  })

  it('超過上限只計數不解析', () => {
    const t = parseClipboardTable(Array.from({ length: 10 }, (_, i) => `r${i}`).join('\n'), 4)
    expect(t.rows).toHaveLength(4)
    expect(t.totalRows).toBe(10)
    expect(t.truncated).toBe(true)
  })

  it('空字串沒有任何列', () => {
    expect(parseClipboardTable('')).toMatchObject({ rows: [], totalRows: 0, columnCount: 0 })
  })
})

describe('columnLetter', () => {
  it('跟 Excel 一樣：A、Z、AA、AZ', () => {
    expect([0, 25, 26, 51].map(columnLetter)).toEqual(['A', 'Z', 'AA', 'AZ'])
  })
})

describe('detectHeaderRow：第一列是不是欄名', () => {
  it('認得的欄名（含「財產編號」這種帶前綴的）', () => {
    expect(detectHeaderRow([['財產編號', '名稱'], ['TP-0001', '筆電']]).index).toBe(0)
    expect(detectHeaderRow([['SKU', 'Name'], ['A-001', 'Pen']]).index).toBe(0)
  })

  it('前面有空白列時，欄名列是第一個不是空白的列', () => {
    expect(detectHeaderRow([[''], ['網址'], ['https://example.com/1']]).index).toBe(1)
  })

  it('欄名不認得，但底下都是編號或網址、第一格是沒有數字的文字', () => {
    expect(detectHeaderRow([['掃了會開啟'], ['https://example.com/a'], ['https://example.com/b']]).index).toBe(0)
  })

  it('第一列就是資料', () => {
    expect(detectHeaderRow([['TP-0001', '筆電'], ['TP-0002', '投影機']]).index).toBe(-1)
    expect(detectHeaderRow([['https://example.com/1'], ['https://example.com/2']]).index).toBe(-1)
  })

  it('資料列裡的「總務單位」「資訊部門」不會被當成欄名', () => {
    expect(detectHeaderRow([['桌子', '總務單位'], ['椅子', '資訊部門']]).index).toBe(-1)
  })

  it('EAN、GTIN 這類條碼欄名也認得', () => {
    expect(detectHeaderRow([['EAN-13', '品名'], ['4710088331236', '綠茶']]).index).toBe(0)
    expect(detectHeaderRow([['GTIN', 'Name'], ['4710088331236', 'Tea']]).index).toBe(0)
  })

  it('只有一列時不算有欄名', () => {
    expect(detectHeaderRow([['財產編號']]).index).toBe(-1)
  })
})

describe('guessColumns：預設的內容欄與檔名欄', () => {
  it('有「網址」欄就拿它做內容，檔名用「編號」欄', () => {
    const rows = [['編號', '名稱', '網址'], ['A1', '櫻花', 'https://example.com/tree/a1']]
    expect(guessColumns(rows, 0)).toEqual({ content: 2, name: 0 })
  })

  it('沒有欄名時，值多半是網址的那一欄做內容，檔名用另一欄', () => {
    const rows = [['A1', 'https://example.com/1'], ['A2', 'https://example.com/2']]
    expect(guessColumns(rows, -1)).toEqual({ content: 1, name: 0 })
  })

  it('內容不是網址就用內容本身當檔名', () => {
    expect(guessColumns([['TP-0001'], ['TP-0002']], -1)).toEqual({ content: 0, name: 0 })
    expect(guessColumns([['財產編號', '名稱'], ['TP-0001', '筆電']], 0)).toEqual({ content: 0, name: 0 })
  })

  it('欄名是「條碼」「EAN」的那一欄做內容，檔名用「編號」欄', () => {
    expect(guessColumns([['編號', '條碼'], ['A1', '4710088331236']], 0)).toEqual({ content: 1, name: 0 })
    expect(guessColumns([['品名', '商品條碼', '貨號'], ['綠茶', '4710088331236', 'G-01']], 0)).toEqual({ content: 1, name: 2 })
    expect(guessColumns([['Item code', 'EAN-13'], ['A1', '4710088331236']], 0)).toEqual({ content: 1, name: 0 })
    expect(guessColumns([['Name', 'Barcode'], ['Tea', '4710088331236']], 0)).toEqual({ content: 1, name: 1 })
    expect(guessColumns([['Barcode', 'ItemCode'], ['4710088331236', 'G-01']], 0)).toEqual({ content: 0, name: 1 })
  })

  it('同時有網址欄與條碼欄時，網址欄做內容', () => {
    expect(guessColumns([['條碼', '網址'], ['4710088331236', 'https://example.com/p/1']], 0)).toEqual({ content: 1, name: 0 })
  })

  it('欄名裡的 ocean、mean 不會被當成 EAN', () => {
    expect(guessColumns([['編號', 'Ocean'], ['A1', 'Pacific']], 0)).toEqual({ content: 0, name: 0 })
  })

  it('只有一欄網址時用流水號', () => {
    expect(guessColumns([['https://example.com/1'], ['https://example.com/2']], -1)).toEqual({ content: 0, name: -1 })
  })
})
