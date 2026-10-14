/**
 * 英文版的批次：美國 Letter 的型號資料（跟 Avery 同規格）、英寸的自訂尺寸與位移、英文的錯誤訊息。
 * 繁中版的行為不變：每個函式不傳 locale 時，訊息跟原本一個字都不差（原本的測試照跑）。
 */
import { describe, it, expect } from 'vitest'
import { LETTER, OFFSET_LIMIT_IN, PAPERS, inToMm, mmToIn, pageRule } from './paper'
import { US_LABEL_SHEETS, US_DEFAULT_SHEET_ID, sheetById, sheetCells, sheetLabelEn, usSheetById, type LabelSheet } from './labelSheets'
import { cellRect, clampOffsetIn, contentBox, customInputFrom, gridBottom, gridFitsPaper, gridRight, parseCustomGrid } from './labelLayout'
import { buildSequence, type SequenceSpec } from './sequence'
import { applyTemplate, checkTemplate, templateToken } from './template'
import { checkRows } from './rows'
import { PRINT_FONTS_EN, printFontsFor } from './printFonts'
import { validateBarcode } from '../validateBarcode'
import { detectHeaderRow, guessColumns, parseClipboardTable } from './table'
import { batchCopy } from './copy'

const PT = 25.4 / 72

describe('Letter 的型號（跟 Avery 同規格）', () => {
  it('四個 Letter 型號加一個 A4，預設 5160', () => {
    expect(US_LABEL_SHEETS.map(s => s.id)).toEqual(['avery-5160', 'avery-5163', 'avery-5167', 'avery-22806', 'a4-3x7'])
    expect(US_DEFAULT_SHEET_ID).toBe('avery-5160')
    expect(usSheetById[US_DEFAULT_SHEET_ID]).toBeDefined()
    for (const s of US_LABEL_SHEETS.filter(x => x.brand === 'avery')) expect(s.paper, s.id).toBe('letter')
    expect(usSheetById['a4-3x7']!.paper).toBe('a4')
  })

  // 格數、欄列、標籤尺寸（in）照 Avery 範本；位置的數字見 labelSheets.ts 的說明
  const SPEC: Record<string, { cells: number; columns: number; rows: number; widthIn: number; heightIn: number }> = {
    'avery-5160': { cells: 30, columns: 3, rows: 10, widthIn: 2.63, heightIn: 1 },
    'avery-5163': { cells: 10, columns: 2, rows: 5, widthIn: 4, heightIn: 2 },
    'avery-5167': { cells: 80, columns: 4, rows: 20, widthIn: 1.75, heightIn: 0.5 },
    'avery-22806': { cells: 12, columns: 3, rows: 4, widthIn: 2, heightIn: 2 },
  }
  it.each(Object.entries(SPEC))('%s：格數、欄列與標籤尺寸', (id, spec) => {
    const s = usSheetById[id]!
    expect(sheetCells(s)).toBe(spec.cells)
    expect([s.columns, s.rows]).toEqual([spec.columns, spec.rows])
    expect(s.labelWidthMm).toBeCloseTo(spec.widthIn * 25.4, 2)
    expect(s.labelHeightMm).toBeCloseTo(spec.heightIn * 25.4, 2)
  })

  describe.each(US_LABEL_SHEETS.map(s => [s.id, s] as [string, LabelSheet]))('%s', (_id, s) => {
    const paper = PAPERS[s.paper ?? 'a4']
    it('每一格都在紙裡', () => {
      expect(gridFitsPaper(s, paper)).toBe(true)
      for (let i = 0; i < sheetCells(s); i += 1) {
        const r = cellRect(s, i)
        expect(r.x + r.w).toBeLessThanOrEqual(paper.widthMm + 1e-6)
        expect(r.y + r.h).toBeLessThanOrEqual(paper.heightMm + 1e-6)
      }
    })
    it('左右邊界相差 1 mm 以內；Avery 這四款上下也對稱', () => {
      expect(Math.abs(gridRight(s, paper) - s.leftMm)).toBeLessThanOrEqual(1)
      if (s.brand === 'avery') expect(Math.abs(gridBottom(s, paper) - s.topMm)).toBeLessThanOrEqual(0.05)
    })
    it('英文選單上的名字有格數、欄列與尺寸', () => {
      const label = sheetLabelEn(s)
      expect(label).toContain(`${sheetCells(s)} per sheet (${s.columns} × ${s.rows})`)
      expect(label).toContain(s.nominal!)
      if (s.brand === 'avery') expect(label.startsWith(`${s.model}: `)).toBe(true)
    })
  })

  it('格子的位置對得上 Avery 官方 PDF 範本的座標（點，1/72 in，從紙的左上角量）', () => {
    // 5160 第 3 欄的左緣 409.5 點、第 2 列的上緣 108 點；5163 第 2 欄 312.75 點；5167 第 4 欄 464.4 點；22806 第 4 列 603 點
    expect(cellRect(usSheetById['avery-5160']!, 2).x / PT).toBeCloseTo(409.5, 1)
    expect(cellRect(usSheetById['avery-5160']!, 3).y / PT).toBeCloseTo(108, 1)
    expect(cellRect(usSheetById['avery-5163']!, 1).x / PT).toBeCloseTo(312.75, 1)
    expect(cellRect(usSheetById['avery-5167']!, 3).x / PT).toBeCloseTo(464.4, 1)
    expect(cellRect(usSheetById['avery-22806']!, 9).y / PT).toBeCloseTo(603, 1)
    // 5160 的欄距 2.75 in（標籤 2.63 in 加 0.12 in 的空隙）
    const s = usSheetById['avery-5160']!
    expect((cellRect(s, 1).x - cellRect(s, 0).x) / 25.4).toBeCloseTo(2.75, 3)
  })

  it('A4 的 21 格跟龍德 LD-817 同一個版面（63.5 × 38.1 mm）', () => {
    const a4 = usSheetById['a4-3x7']!
    const ld = sheetById['longder-LD-817']!
    for (const k of ['columns', 'rows', 'labelWidthMm', 'labelHeightMm', 'topMm', 'leftMm', 'colGapMm', 'rowGapMm'] as const) expect(a4[k], k).toBe(ld[k])
  })
})

describe('Letter 的紙張與列印規則', () => {
  it('Letter 是 215.9 × 279.4 mm（8.5 × 11 in）', () => {
    expect(LETTER).toEqual({ widthMm: 215.9, heightMm: 279.4 })
    expect(mmToIn(LETTER.widthMm)).toBe(8.5)
    expect(mmToIn(LETTER.heightMm)).toBe(11)
    expect(inToMm(8.5)).toBeCloseTo(215.9, 6)
  })
  it('@page 跟著紙張換', () => {
    expect(pageRule('letter')).toBe('@page { size: letter; margin: 0; }')
    expect(pageRule('a4')).toBe('@page { size: A4; margin: 0; }')
  })
  it('貼著紙邊的內縮照紙張的寬高算', () => {
    const { box, clipped } = contentBox({ x: 200, y: 270, w: 15.9, h: 9.4 }, true, LETTER)
    expect(box.x + box.w).toBeCloseTo(LETTER.widthMm - 5, 6)
    expect(box.y + box.h).toBeCloseTo(LETTER.heightMm - 5, 6)
    expect(clipped).toBe(true)
  })
})

describe('英文版的自訂尺寸：填英寸、內部換成 mm', () => {
  const s5160 = usSheetById['avery-5160']!
  it('從型號開始改：欄位是英寸', () => {
    expect(customInputFrom(s5160, 'in')).toMatchObject({ columns: '3', rows: '10', labelWidthMm: '2.63', labelHeightMm: '1', topMm: '0.5', leftMm: '0.188', colGapMm: '0.12', rowGapMm: '0' })
  })
  it('英寸換成 mm 之後排得進 Letter', () => {
    const r = parseCustomGrid(customInputFrom(s5160, 'in'), { paper: PAPERS.letter, locale: 'en', unit: 'in' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.grid.labelWidthMm).toBeCloseTo(66.802, 3)
      expect(r.grid.topMm).toBeCloseTo(12.7, 3)
    }
  })
  it('英文的錯誤訊息，寬度用英寸寫', () => {
    const base = customInputFrom(s5160, 'in')
    expect(parseCustomGrid({ ...base, columns: '0' }, { paper: PAPERS.letter, locale: 'en', unit: 'in' }))
      .toEqual({ ok: false, field: 'columns', error: 'Columns must be a whole number from 1 to 20.' })
    expect(parseCustomGrid({ ...base, labelWidthMm: '0.3' }, { paper: PAPERS.letter, locale: 'en', unit: 'in' }))
      .toEqual({ ok: false, field: 'labelWidthMm', error: 'Label width must be at least 0.4 in.' })
    expect(parseCustomGrid({ ...base, topMm: 'x' }, { paper: PAPERS.letter, locale: 'en', unit: 'in' }))
      .toEqual({ ok: false, field: 'topMm', error: 'Top margin must be 0 or more (inches).' })
    const wide = parseCustomGrid({ ...base, labelWidthMm: '3' }, { paper: PAPERS.letter, locale: 'en', unit: 'in' })
    expect(wide).toEqual({ ok: false, field: 'colGapMm', error: 'The left margin plus 3 columns comes to 9.428 in, wider than a Letter sheet (8.5 in).' })
  })
  it('繁中版照舊：mm、A4、原本的訊息', () => {
    const r = parseCustomGrid({ columns: '3', rows: '8', labelWidthMm: '80', labelHeightMm: '30', topMm: '0', leftMm: '0', colGapMm: '0', rowGapMm: '0' })
    expect(r).toEqual({ ok: false, field: 'labelWidthMm', error: '左邊界加上 3 欄的寬度共 240 mm，超出 A4 的寬 210 mm。' })
  })
})

describe('英文版的位移：英寸，0.01 in 一格', () => {
  it('取到 0.01、限制在 ±OFFSET_LIMIT_IN，不是數字就是 0', () => {
    expect(OFFSET_LIMIT_IN).toBe(0.39)
    expect(clampOffsetIn('0.016')).toBe(0.02)
    expect(clampOffsetIn(0.123)).toBe(0.12)
    expect(clampOffsetIn(1)).toBe(0.39)
    expect(clampOffsetIn(-5)).toBe(-0.39)
    expect(clampOffsetIn('')).toBe(0)
    expect(clampOffsetIn('abc')).toBe(0)
    expect(Object.is(clampOffsetIn('-0.001'), 0)).toBe(true)
  })
})

describe('EAN-13 的 20 到 29 開頭', () => {
  // GS1 General Specifications 的 GS1 Prefix 表：20 到 29 是「限定流通的號碼（RCN），用在一個地區內，由各國的 GS1 決定」，
  // 不是保留給店內用；只限一家公司內部的是 04。英文的說法照這個寫，不再寫成 reserved for in-store use。
  it('英文的提醒寫成限定流通的號碼、各國 GS1 決定用法，不說保留給店內用', () => {
    const note = batchCopy.en.check.storeCode
    expect(note).toContain('restricted circulation numbers')
    expect(note).toContain('GS1 office in each country')
    expect(note).not.toMatch(/reserved for in-store/i)
  })
  it('繁中照 GS1 台灣的前置碼表叫店內碼，句子不變', () => {
    expect(batchCopy['zh-TW'].check.storeCode).toBe('20 到 29 開頭的 EAN-13 是店內碼，只在你自己的店裡有效，不能拿去通路上架；要上架請向 GS1 台灣申請正式的商品條碼。')
  })
})

describe('英文的錯誤訊息', () => {
  const spec: SequenceSpec = { prefix: 'BIN-', start: '1', until: 'count', count: '10', end: '', step: '1', pad: '3', suffix: '' }
  it('連號', () => {
    expect(buildSequence({ ...spec, start: 'x' }, 2000, 'en')).toMatchObject({ ok: false, field: 'start', error: 'Start must be 0 or a positive whole number.' })
    expect(buildSequence({ ...spec, count: '5000' }, 2000, 'en')).toMatchObject({ ok: false, error: 'You can make up to 2,000 at a time, and these settings make 5,000. Please split them into batches.' })
    expect(buildSequence({ ...spec, until: 'end', end: '0', start: '5' }, 2000, 'en')).toMatchObject({ error: 'End must be the same as or larger than start.' })
    expect(buildSequence(spec, 2000, 'en')).toEqual(buildSequence(spec, 2000))
    expect(buildSequence({ ...spec, start: 'x' }, 2000)).toMatchObject({ error: '起始值請填 0 或正整數。' })
  })

  it('範本的記號：英文是 {id}（大小寫都認得），繁中是 {編號}，兩邊不混用', () => {
    expect(templateToken('en')).toBe('{id}')
    expect(templateToken()).toBe('{編號}')
    expect(checkTemplate('https://x.example/a/{id}', 'en')).toEqual({ ok: true, isUrl: true, empty: false })
    expect(checkTemplate('https://x.example/a/{ID}', 'en').ok).toBe(true)
    expect(checkTemplate('https://x.example/a/{編號}', 'en')).toEqual({ ok: false, error: 'Add {id} to the template so each code gets its own value from the list, or clear the field if you don\'t need a template.' })
    expect(checkTemplate('https://x.example/a/{id}').ok).toBe(false)
    expect(applyTemplate('https://x.example/a/{id}?b={ID}', 'A 01/x', 'en')).toBe('https://x.example/a/A%2001%2Fx?b=A%2001%2Fx')
    expect(applyTemplate('BIN-{id}', 'A 1', 'en')).toBe('BIN-A 1')
  })

  it('逐列檢查：空白、QR Code 太長、條碼的錯誤都是英文', () => {
    const rows = [
      { line: 1, value: '', name: null },
      { line: 2, value: 'x'.repeat(3000), name: null },
    ]
    const qr = checkRows(rows, { symbology: 'qr', ec: 'M', template: '', locale: 'en' })
    expect(qr.map(r => (r.ok ? 'ok' : r.error))).toEqual([
      'This one is empty.',
      'Too long for a QR code. Shorten it or lower the error correction level.',
    ])
    const ean = checkRows([{ line: 1, value: '47100883312A', name: null }], { symbology: 'ean13', ec: 'M', template: '', locale: 'en' })
    expect(ean[0]).toMatchObject({ ok: false, code: 'charset', error: 'EAN-13 takes the digits 0 to 9 only. Not allowed: "A".' })
    const tpl = checkRows([{ line: 1, value: '7', name: null }], { symbology: 'qr', ec: 'M', template: 'https://x.example/{id}', locale: 'en' })
    expect(tpl[0]).toMatchObject({ ok: true, normalized: 'https://x.example/7' })
  })

  it('條碼的檢查：每一種錯誤都有英文，繁中不變', () => {
    expect(validateBarcode('ean13', '', 'en').error).toBe('Enter the barcode content.')
    expect(validateBarcode('ean13', '123', 'en').error).toBe('EAN-13 needs 12 digits (the check digit is added for you) or all 13 digits. This has 3.')
    expect(validateBarcode('ean13', '4710088331237', 'en').error).toBe('The check digit does not match. From the first 12 digits, the EAN-13 check digit should be 6, not 7. Check the number, or enter just the first 12 digits and let the tool add it.')
    expect(validateBarcode('code39', 'A*B', 'en').code).toBe('code39Star')
    expect(validateBarcode('code39', 'a#b', 'en').error).toBe('Code 39 takes only numbers, capital letters, - . $ / + % and spaces. Not allowed: "#".')
    expect(validateBarcode('code39', 'A'.repeat(49), 'en').error).toBe('Code 39 holds up to 48 characters, and this has 49. Shorten it or switch to Code 128.')
    expect(validateBarcode('code128', 'é1ñ2ü3ø', 'en').error).toBe('Code 128 takes letters, numbers and keyboard symbols only. Not allowed: "é", "ñ", "ü" (4 in total). For anything else, use a QR code.')
    expect(validateBarcode('code128', 'A'.repeat(81), 'en').error).toBe('Code 128 holds up to 80 characters, and this has 81. Shorten it: very wide barcodes are hard to scan.')
    expect(validateBarcode('ean13', '123').error).toBe('EAN-13 需要 12 位數字（工具會自動補上檢查碼）或 13 位完整條碼。目前有 3 位。')
    expect(validateBarcode('ean13', '4710088331236', 'en')).toEqual(validateBarcode('ean13', '4710088331236'))
  })
})

describe('英文版的字型', () => {
  it('Arial、Verdana、Times New Roman，預設 Arial；偵測的名字都寫在 CSS 堆疊裡', () => {
    const { fonts, defaultId } = printFontsFor('en')
    expect(fonts).toBe(PRINT_FONTS_EN)
    expect(fonts.map(f => f.id)).toEqual(['arial', 'verdana', 'times'])
    expect(defaultId).toBe('arial')
    for (const f of fonts) for (const probe of f.probes) expect(f.stack, f.id).toContain(`"${probe}"`)
    expect(printFontsFor('zh-TW').defaultId).toBe('jhenghei')
  })
})

describe('英文的欄名', () => {
  const rows = (text: string) => parseClipboardTable(text).rows
  it.each([
    'Asset tag\tDescription\tLocation\nA-1001\tLaptop\tRoom 204\nA-1002\tProjector\tRoom 105',
    'Serial number\tQty\nSN-001\t2\nSN-002\t5',
    'Part no.\tNotes\nP-1\tspare\nP-2\tspare',
  ])('認得第一列是欄名：%s', (text) => {
    expect(detectHeaderRow(rows(text)).index).toBe(0)
  })
  it('網址欄做成碼時，Asset tag 那一欄當檔名', () => {
    const r = rows('Link\tAsset tag\nhttps://x.example/1\tA-1\nhttps://x.example/2\tA-2')
    expect(guessColumns(r, 0)).toEqual({ content: 0, name: 1 })
  })
  it('資料列裡剛好是單字的值不會被當成欄名（只看第一列）', () => {
    expect(detectHeaderRow(rows('Laptop\tRoom 204\nProjector\tRoom 105')).index).toBe(-1)
  })
})
