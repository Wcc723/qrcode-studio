/**
 * 批次頁的「印成 A4 標籤紙」：型號、從第 N 格開始、每筆 N 份、跨頁、位移、對位測試頁、擋下與提醒、列印。
 * happy-dom 沒有 canvas，字寬走 estimateMeasure；實際的列印版面（每頁 210 × 297 mm、格子位置）由瀏覽器驗。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import BatchTool from './BatchTool.vue'
import { OFFSET_STORAGE_KEY } from '@/utils/batch-label-offset'
import { BARCODE_WARN_X_MM, PRINTER_EDGE_RANGE } from '@/pure/batch/paper'

const opts = { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } }, attachTo: document.body }
const $ = (w: VueWrapper, t: string) => w.find(`[data-test="${t}"]`)
const $$ = (w: VueWrapper, t: string) => w.findAll(`[data-test="${t}"]`)

const wrappers: VueWrapper[] = []
async function mountLabels(list?: string) {
  const w = mount(BatchTool, opts)
  wrappers.push(w)
  await w.find('[data-test="batch-output-label"]').setValue(true)
  await flushPromises()
  if (list !== undefined) {
    await $(w, 'batch-paste').setValue(list)
    await flushPromises()
  }
  return w
}
const filledCells = (w: VueWrapper) => $$(w, 'label-cell').filter(c => !c.classes('label-cell-blank'))
const styleOf = (el: { attributes: (k: string) => string | undefined }) => el.attributes('style') ?? ''

const LIST = '財產編號\t品名\t保管單位\nTP-0001\t筆記型電腦\t總務處\nTP-0002\t投影機\t教務處\nTP-0003\t印表機\t學務處\n'

let print: ReturnType<typeof vi.fn>
beforeEach(() => {
  print = vi.fn()
  Object.defineProperty(window, 'print', { value: print, configurable: true, writable: true })
  localStorage.clear()
})
afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
  Reflect.deleteProperty(window, 'gtag')
  document.body.innerHTML = ''
})

describe('切到「印成 A4 標籤紙」', () => {
  it('預設型號是鶴屋 L3464，還沒有清單時畫一張空的格子，不能印標籤', async () => {
    const w = await mountLabels()
    expect(($(w, 'label-sheet-select').element as HTMLSelectElement).value).toBe('herwood-L3464')
    expect($(w, 'label-sheet-info').text()).toContain('每張 24 格（3 欄 × 8 列），每格寬 64 × 高 33.9 mm')
    expect($(w, 'label-sheet-info').text()).toContain('上 13.7、左 6.3、右 6.3、下 12.1 mm')
    expect($$(w, 'label-sheet')).toHaveLength(1)
    expect($$(w, 'label-cell')).toHaveLength(24)
    expect(filledCells(w)).toHaveLength(0)
    expect($(w, 'label-print-btn').attributes('disabled')).toBeDefined()
    expect($(w, 'label-blocker').text()).toBe('請先貼上清單。')
    // ZIP 的下載區不見了
    expect($(w, 'batch-download').exists()).toBe(false)
  })

  it('貼上清單：每一筆一格，格子照型號的位置用 mm 定位，預設印編號、品名、保管單位', async () => {
    const w = await mountLabels(LIST)
    const cells = filledCells(w)
    expect(cells).toHaveLength(3)
    expect(styleOf(cells[0]!)).toContain('left: 6.3mm')
    expect(styleOf(cells[0]!)).toContain('top: 13.7mm')
    expect(styleOf(cells[0]!)).toContain('width: 64mm')
    expect(styleOf(cells[1]!)).toContain('left: 73mm')
    expect(cells[0]!.findAll('.label-line').map(l => l.text())).toEqual(['TP-0001', '筆記型電腦', '總務處'])
    expect(cells[0]!.find('svg.label-code').attributes('data-kind')).toBe('qr')
    expect($(w, 'label-print-btn').text()).toContain('列印標籤（1 張 A4）')
    expect($(w, 'label-summary').text()).toBe('共 3 筆，印 1 張 A4。')
  })

  it('每一行可以改選別的欄或不印', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-line-1').setValue('none')
    await $(w, 'label-line-3').setValue('col:0')
    await flushPromises()
    expect(filledCells(w)[0]!.findAll('.label-line').map(l => l.text())).toEqual(['筆記型電腦', 'TP-0001'])
  })

  it('貼上的內容一律是文字，不會變成 HTML', async () => {
    const w = await mountLabels('編號\t備註\nA1\t<img src=x>\n')
    expect(w.find('img').exists()).toBe(false)
    expect(filledCells(w)[0]!.text()).toContain('<img src=x>')
  })

  it('切回「下載 ZIP」再切回來，設定還在', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-sheet-select').setValue('longder-LD-8108')
    await w.find('[data-test="batch-output-zip"]').setValue(true)
    await flushPromises()
    expect($(w, 'label-print').exists()).toBe(false)
    await w.find('[data-test="batch-output-label"]').setValue(true)
    await flushPromises()
    expect(($(w, 'label-sheet-select').element as HTMLSelectElement).value).toBe('longder-LD-8108')
  })
})

describe('從第 N 格開始、每筆 N 份、跨頁', () => {
  it('從第 5 格開始：前 4 格留白，提示是第幾列第幾欄', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-start').setValue('5')
    await flushPromises()
    const cells = $$(w, 'label-cell')
    expect(cells.slice(0, 4).every(c => c.classes('label-cell-blank'))).toBe(true)
    expect(cells[4]!.attributes('data-cell')).toBe('5')
    expect(cells[4]!.find('.label-line').text()).toBe('TP-0001')
    expect($(w, 'label-start-hint').text()).toBe('第 5 格是第 2 列第 2 欄，前面 4 格留白（只有第一張）。')
  })

  it('換成格數比較少的型號、份數超過上限時，欄位裡的數字拉回實際的值', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-sheet-select').setValue('longder-LD-8101')
    await $(w, 'label-start').setValue('100')
    await flushPromises()
    await $(w, 'label-sheet-select').setValue('herwood-L3464')
    await flushPromises()
    expect(($(w, 'label-start').element as HTMLInputElement).value).toBe('24')
    await $(w, 'label-copies').setValue('99')
    await $(w, 'label-copies').trigger('change')
    await flushPromises()
    expect(($(w, 'label-copies').element as HTMLInputElement).value).toBe('20')
    await $(w, 'label-offset-x').setValue('12.34')
    await $(w, 'label-offset-x').trigger('change')
    await flushPromises()
    expect(($(w, 'label-offset-x').element as HTMLInputElement).value).toBe('10')
  })

  it('每筆印 2 份：同一筆連續兩格', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-copies').setValue('2')
    await flushPromises()
    expect(filledCells(w).map(c => c.find('.label-line').text())).toEqual(['TP-0001', 'TP-0001', 'TP-0002', 'TP-0002', 'TP-0003', 'TP-0003'])
    expect($(w, 'label-summary').text()).toBe('共 3 筆 × 2 份，印 1 張 A4。')
  })

  it('跨頁：30 筆排在 24 格的紙上是 2 張，第二張從第 1 格開始', async () => {
    const rows = Array.from({ length: 30 }, (_, i) => `A${String(i + 1).padStart(3, '0')}`).join('\n')
    const w = await mountLabels(rows)
    const sheets = $$(w, 'label-sheet')
    expect(sheets).toHaveLength(2)
    expect(sheets[1]!.findAll('[data-test="label-cell"]')).toHaveLength(6)
    expect(sheets[1]!.find('[data-test="label-cell"]').attributes('data-cell')).toBe('1')
    expect($(w, 'label-print-btn').text()).toContain('2 張 A4')
  })

  it('螢幕上先預覽前 3 張，其他張列印時才出現，可以展開', async () => {
    const rows = Array.from({ length: 24 * 4 + 1 }, (_, i) => `B${i + 1}`).join('\n')
    const w = await mountLabels(rows)
    const sheets = $$(w, 'label-sheet')
    expect(sheets).toHaveLength(5)
    expect(sheets.filter(s => s.classes('label-sheet-extra'))).toHaveLength(2)
    expect($(w, 'label-more').text()).toContain('列印時會印出全部 5 張')
    await $(w, 'label-show-all').trigger('click')
    expect($$(w, 'label-sheet').filter(s => s.classes('label-sheet-extra'))).toHaveLength(0)
  })
})

describe('X／Y 位移與記住這台印表機', () => {
  it('位移套到每一格；不勾選就不寫進瀏覽器', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const w = await mountLabels(LIST)
    await $(w, 'label-offset-x').setValue('1.5')
    await $(w, 'label-offset-y').setValue('-0.5')
    await flushPromises()
    expect(styleOf(filledCells(w)[0]!)).toContain('left: 7.8mm')
    expect(styleOf(filledCells(w)[0]!)).toContain('top: 13.2mm')
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
    setItem.mockRestore()
  })

  it('勾選「記住」只存兩個數字，清單不會出現在儲存空間；取消就刪掉', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-offset-x').setValue('2')
    await $(w, 'label-remember').setValue(true)
    await flushPromises()
    expect(localStorage.length).toBe(1)
    expect(JSON.parse(localStorage.getItem(OFFSET_STORAGE_KEY)!)).toEqual({ x: 2, y: 0 })
    await $(w, 'label-offset-y').setValue('-1.2')
    await flushPromises()
    expect(JSON.parse(localStorage.getItem(OFFSET_STORAGE_KEY)!)).toEqual({ x: 2, y: -1.2 })
    const everything = Object.keys(localStorage).map(k => `${k}=${localStorage.getItem(k)}`).join('\n')
    for (const text of ['TP-0001', '筆記型電腦', '總務處', 'herwood', 'L3464']) expect(everything).not.toContain(text)
    await $(w, 'label-remember').setValue(false)
    await flushPromises()
    expect(localStorage.length).toBe(0)
  })

  it('下次打開時讀回記住的位移（掛載之後才讀）', async () => {
    localStorage.setItem(OFFSET_STORAGE_KEY, JSON.stringify({ x: -1, y: 0.5 }))
    const w = await mountLabels(LIST)
    expect(($(w, 'label-offset-x').element as HTMLInputElement).value).toBe('-1')
    expect(($(w, 'label-remember').element as HTMLInputElement).checked).toBe(true)
    expect(styleOf(filledCells(w)[0]!)).toContain('left: 5.3mm')
  })
})

describe('對位測試頁', () => {
  it('只畫格線與格號、加上 5 公分校正尺；沒有清單也能印，不送 GA', async () => {
    const gtag = vi.fn()
    Object.assign(window, { gtag })
    const w = await mountLabels()
    await w.find('[data-test="label-target-test"]').setValue(true)
    await flushPromises()
    expect($$(w, 'label-sheet')).toHaveLength(0)
    const sheet = $(w, 'label-test-sheet')
    expect(sheet.findAll('[data-test="label-test-cell"]')).toHaveLength(24)
    expect(sheet.findAll('text').map(t => t.text()).slice(0, 3)).toEqual(['1', '2', '3'])
    const base = sheet.find('[data-test="label-ruler-base"]')
    expect(Number(base.attributes('x2')) - Number(base.attributes('x1'))).toBe(50)
    expect($(w, 'label-test-info').text()).toContain('鶴屋 L3464（24 格）')
    expect($(w, 'label-print-btn').attributes('disabled')).toBeUndefined()
    expect($(w, 'label-print-btn').text()).toContain('印對位測試頁（1 張 A4）')
    await $(w, 'label-print-btn').trigger('click')
    expect(print).toHaveBeenCalledTimes(1)
    expect(gtag).not.toHaveBeenCalled()
  })

  it('格線跟著位移', async () => {
    const w = await mountLabels()
    await $(w, 'label-offset-x').setValue('-2')
    await w.find('[data-test="label-target-test"]').setValue(true)
    await flushPromises()
    expect($(w, 'label-test-sheet').find('[data-test="label-test-cell"]').attributes('x')).toBe('4.3')
    expect($(w, 'label-test-info').text()).toContain('左右 −2.0 mm')
  })
})

describe('列印', () => {
  it('按「列印標籤」先送一次 GA（筆數級距、碼制、輸出方式 label），再開瀏覽器的列印視窗', async () => {
    const gtag = vi.fn()
    Object.assign(window, { gtag })
    const w = await mountLabels(LIST)
    await $(w, 'label-print-btn').trigger('click')
    expect(gtag).toHaveBeenCalledWith('event', 'batch_download', { count_range: '1-10', symbology: 'qr', output: 'label' })
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('顯示列印區時在 <head> 加 @page A4、邊界 0；切回 ZIP 就拿掉', async () => {
    const w = await mountLabels(LIST)
    const rule = () => [...document.head.querySelectorAll('style[data-label-page]')].map(s => s.textContent)
    expect(rule()).toEqual(['@page { size: A4; margin: 0; }'])
    await w.find('[data-test="batch-output-zip"]').setValue(true)
    await flushPromises()
    expect(rule()).toEqual([])
  })

  it('列印設定的重點一直看得到', async () => {
    const w = await mountLabels()
    expect($(w, 'label-print-tips').text()).toBe('列印時紙張選 A4、縮放選「實際大小（100%）」、邊界選「無」，不要選「符合頁面大小」。')
  })
})

describe('擋下與提醒', () => {
  it('EAN-13 在 25.4 mm 寬的格子裡低於 80% 倍率：列出是哪幾列並擋下列印', async () => {
    const w = await mountLabels('4710088331236\n4710088331243\n')
    await w.find('[data-test="batch-sym-ean13"]').setValue(true)
    await $(w, 'label-sheet-select').setValue('longder-LD-8101')
    await flushPromises()
    expect($(w, 'label-notice-barcode-narrow').text()).toContain('第 1、2 列：條碼在這個格子裡太窄')
    expect($(w, 'label-notice-barcode-narrow').text()).toContain('EAN-13 至少要 0.264 mm（標準尺寸的 80%）')
    expect($(w, 'label-print-btn').attributes('disabled')).toBeDefined()
    // 就算用 Ctrl＋P 繞過停用的列印鈕，掃不到的條碼也不會畫進列印區；螢幕上標出原因
    const cells = filledCells(w)
    expect(cells.every(c => !c.find('svg.label-code').exists() && !c.find('.label-line').exists())).toBe(true)
    expect(cells[0]!.find('[data-test="label-cell-blocked"]').text()).toBe('條碼太窄，不會印')
    // 對位測試頁照樣可以印
    await w.find('[data-test="label-target-test"]').setValue(true)
    await flushPromises()
    expect($(w, 'label-print-btn').attributes('disabled')).toBeUndefined()
  })

  it('條碼偏細只提醒，建議的寬度照 paper.ts 寫：ITF-14 物流外箱、Code 128', async () => {
    const itf = await mountLabels('15400141288763\n')
    await itf.find('[data-test="batch-sym-itf14"]').setValue(true)
    await flushPromises()
    expect($(itf, 'label-notice-barcode-thin').text()).toContain(`外箱給物流掃描時建議 ${BARCODE_WARN_X_MM.itf14} mm 以上`)
    expect($(itf, 'label-print-btn').attributes('disabled')).toBeUndefined()

    const c128 = await mountLabels('A001\n')
    await c128.find('[data-test="batch-sym-code128"]').setValue(true)
    await $(c128, 'label-sheet-select').setValue('longder-LD-8101')
    await flushPromises()
    expect($(c128, 'label-notice-barcode-thin').text()).toContain(`建議 ${BARCODE_WARN_X_MM.code128} mm 以上`)
  })

  it('一維條碼下方印號碼，同一張的字另外排在下面', async () => {
    const w = await mountLabels(LIST)
    await w.find('[data-test="batch-sym-code128"]').setValue(true)
    await flushPromises()
    const lines = filledCells(w)[0]!.findAll('.label-line')
    expect(lines[0]!.attributes('data-hri')).toBe('true')
    expect(lines.map(l => l.text())).toEqual(['TP-0001', '筆記型電腦', '總務處'])
  })

  it('字太長截斷：以「…」結尾並列出是哪幾列', async () => {
    const w = await mountLabels(`編號\t名稱\nA1\t${'國立臺灣大學醫學院附設醫院'.repeat(3)}\nA2\t短\n`)
    await $(w, 'label-sheet-select').setValue('longder-LD-8101')
    await flushPromises()
    expect($(w, 'label-notice-truncated').text()).toContain('第 2 列的字太長')
    const line = filledCells(w)[0]!.find('[data-truncated="true"]')
    expect(line.text().endsWith('…')).toBe(true)
    // 截斷只提醒，照樣可以印
    expect($(w, 'label-print-btn').attributes('disabled')).toBeUndefined()
  })

  it('全版切割：外圈的格子自動內縮並說明；關掉內縮改成提醒', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-sheet-select').setValue('herwood-C3070')
    await flushPromises()
    expect($(w, 'label-notice-edge').text()).toContain('有 22 格貼近紙邊')
    expect($(w, 'label-notice-edge').text()).toContain(`印不到紙邊 ${PRINTER_EDGE_RANGE}`)
    expect($(w, 'label-notice-edge').text()).toContain('已經自動往內縮')
    const svg = filledCells(w)[0]!.find('svg.label-code')
    // 內距 1.5 mm 不夠，內縮到離紙邊 5 mm
    expect(Number.parseFloat(styleOf(svg).match(/left: ([\d.]+)mm/)![1]!)).toBeGreaterThanOrEqual(5)
    await $(w, 'label-avoid-edge').setValue(false)
    await flushPromises()
    expect($(w, 'label-notice-edge').text()).toContain('碼與字可能被切掉')
  })

  it('自訂尺寸：從目前的型號開始改，超出 A4 時指出原因並擋下', async () => {
    const w = await mountLabels(LIST)
    await $(w, 'label-sheet-select').setValue('custom')
    await flushPromises()
    expect(($(w, 'label-custom-labelWidthMm').element as HTMLInputElement).value).toBe('64')
    await $(w, 'label-custom-labelWidthMm').setValue('70')
    await flushPromises()
    expect($(w, 'label-custom-error').text()).toContain('超出 A4 的寬 210 mm')
    expect($(w, 'label-custom-colGapMm').attributes('aria-invalid')).toBe('true')
    expect($(w, 'label-print-btn').attributes('disabled')).toBeDefined()
    await $(w, 'label-custom-colGapMm').setValue('0')
    await $(w, 'label-custom-leftMm').setValue('0')
    await flushPromises()
    expect($(w, 'label-custom-error').exists()).toBe(false)
    expect(styleOf(filledCells(w)[1]!)).toContain('left: 70mm')
  })

  it('總格數超過上限時請使用者分批', async () => {
    const rows = Array.from({ length: 1100 }, (_, i) => `C${i + 1}`).join('\n')
    const w = await mountLabels(rows)
    await $(w, 'label-copies').setValue('2')
    await flushPromises()
    expect($(w, 'label-blocker').text()).toContain('一次最多印 2,000 格，目前要 2,200 格')
    expect($(w, 'label-print-btn').attributes('disabled')).toBeDefined()
  })
})
