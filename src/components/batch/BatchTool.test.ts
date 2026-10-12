import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import BatchTool from './BatchTool.vue'
import { readZip } from '../../../test/helpers/zip'

const saved: { blob: Blob; name: string }[] = []
vi.mock('@/utils/save-blob', () => ({
  saveBlob: (blob: Blob, name: string) => { saved.push({ blob, name }) },
}))
// 測試可以讓產生停在半路（hold），看產生途中的畫面；平常直接走真的 exportZip
const gate = vi.hoisted(() => ({ hold: null as Promise<void> | null }))
vi.mock('@/utils/batch-export', async (orig) => {
  const mod = await orig<typeof import('@/utils/batch-export')>()
  return {
    ...mod,
    exportZip: async (...args: Parameters<typeof mod.exportZip>) => {
      if (gate.hold) await gate.hold
      return mod.exportZip(...args)
    },
  }
})

const opts = { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } }
const $ = (w: VueWrapper, t: string) => w.find(`[data-test="${t}"]`)

async function paste(w: VueWrapper, text: string) {
  await $(w, 'batch-paste').setValue(text)
  await flushPromises()
}

beforeEach(() => { saved.length = 0; gate.hold = null })
afterEach(() => { Reflect.deleteProperty(window, 'gtag') })

describe('從 Excel 貼上', () => {
  it('認出欄名列、猜內容欄與檔名欄，預覽用編號當檔名', async () => {
    const w = mount(BatchTool, opts)
    await paste(w, '編號\t名稱\t網址\r\nA1\t櫻花\thttps://example.com/tree/a1\r\nA2\t楓樹\thttps://example.com/tree/a2\r\n')
    expect(($(w, 'batch-has-header').element as HTMLInputElement).checked).toBe(true)
    expect(($(w, 'batch-content-col').element as HTMLSelectElement).value).toBe('2')
    expect(($(w, 'batch-name-col').element as HTMLSelectElement).value).toBe('0')
    expect($(w, 'batch-summary').text()).toContain('共 2 列')
    expect($(w, 'batch-summary').text()).toContain('2 筆可以產生')
    expect(w.findAll('[data-test="batch-preview-name"]').map(n => n.text())).toEqual(['A1.png', 'A2.png'])
    expect($(w, 'batch-download').attributes('disabled')).toBeUndefined()
    expect($(w, 'batch-download').text()).toContain('2 張 PNG')
  })

  it('取消「第一列是欄名」之後，欄名那一列也做成碼', async () => {
    const w = mount(BatchTool, opts)
    await paste(w, '財產編號\nTP-0001\nTP-0002')
    await $(w, 'batch-has-header').setValue(false)
    await flushPromises()
    expect($(w, 'batch-summary').text()).toContain('3 筆可以產生')
  })

  it('貼上的內容一律以文字顯示，不會變成 HTML', async () => {
    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-sym-code39"]').setValue(true)
    await paste(w, '<img src=x onerror="alert(1)">')
    expect(w.find('img').exists()).toBe(false)
    expect($(w, 'batch-issues').text()).toContain('<img src=x onerror="alert(1)">')
  })
})

describe('逐列檢查', () => {
  it('錯誤列標紅寫原因，預設全部修好才產生；改成略過就能下載', async () => {
    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-sym-ean13"]').setValue(true)
    await paste(w, '471008833123\n4710088331237\n\n47100883')
    const issues = $(w, 'batch-issues')
    expect(issues.text()).toContain('第 2 列')
    expect(issues.text()).toContain('應該是 6')
    expect(issues.text()).toContain('第 4 列')
    expect($(w, 'batch-appended').text()).toContain('1 筆只有 12 位')
    expect($(w, 'batch-download').attributes('disabled')).toBeDefined()
    expect($(w, 'batch-blocker').text()).toContain('有 2 列要先修正')
    await $(w, 'batch-on-error-skip').setValue(true)
    await flushPromises()
    expect($(w, 'batch-download').attributes('disabled')).toBeUndefined()
    expect($(w, 'batch-download').text()).toContain('1 張')
  })

  it('內容重複只提醒，照樣可以下載', async () => {
    const w = mount(BatchTool, opts)
    await paste(w, 'A001\nA002\nA001')
    expect($(w, 'batch-duplicates').text()).toContain('第 1、3 列都是「A001」')
    expect($(w, 'batch-download').attributes('disabled')).toBeUndefined()
  })

  it('Code 39 含 $ / + % 時提醒讀回來可能不一樣，但不擋下載；其他碼制不提醒', async () => {
    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-sym-code39"]').setValue(true)
    await paste(w, 'AB$E1\nTP+G01\nX%U\nA/B\nTP-0001')
    expect($(w, 'batch-summary').text()).toContain('5 筆可以產生')
    expect($(w, 'batch-code39-shift').text()).toContain('有 4 筆內容含 $ / + % 這幾個符號')
    expect($(w, 'batch-code39-shift').text()).toContain('改用 Code 128')
    expect($(w, 'batch-download').attributes('disabled')).toBeUndefined()
    await paste(w, 'TP-0001\nTP 0002')
    expect($(w, 'batch-code39-shift').exists()).toBe(false)
    // 同樣的內容換成 Code 128 或 QR Code 就讀得回原樣，不提醒
    await paste(w, 'A/B')
    expect($(w, 'batch-code39-shift').exists()).toBe(true)
    await w.find('[data-test="batch-sym-code128"]').setValue(true)
    await flushPromises()
    expect($(w, 'batch-code39-shift').exists()).toBe(false)
    await w.find('[data-test="batch-sym-qr"]').setValue(true)
    await flushPromises()
    expect($(w, 'batch-code39-shift').exists()).toBe(false)
  })

  it('店內碼提醒只在 EAN-13 是 2 開頭時出現', async () => {
    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-sym-ean13"]').setValue(true)
    await paste(w, '200000000001')
    expect($(w, 'batch-store-code').exists()).toBe(true)
    await paste(w, '471008833123')
    expect($(w, 'batch-store-code').exists()).toBe(false)
  })
})

describe('每行一筆與連號', () => {
  it('每行一筆：空白行略過；有 Tab 時建議改用從 Excel 貼上', async () => {
    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-mode-lines"]').setValue(true)
    await $(w, 'batch-lines').setValue('a\n\n b \nc\td')
    await flushPromises()
    expect($(w, 'batch-summary').text()).toContain('共 3 行')
    expect($(w, 'batch-lines-tab').exists()).toBe(true)
  })

  it('連號：即時顯示前三筆與最後一筆；超過上限擋下來', async () => {
    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-mode-sequence"]').setValue(true)
    await $(w, 'seq-prefix').setValue('TP-')
    await $(w, 'seq-count').setValue('500')
    await flushPromises()
    expect($(w, 'seq-preview').text()).toContain('TP-0001、TP-0002、TP-0003 … TP-0500')
    expect($(w, 'seq-preview').text()).toContain('共 500 筆')
    await $(w, 'seq-count').setValue('2001')
    await flushPromises()
    expect($(w, 'seq-preview').text()).toContain('一次最多 2,000 筆')
    expect($(w, 'batch-download').attributes('disabled')).toBeDefined()
  })

  it('EAN-13 的連號提示：要產生 12 位數', async () => {
    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-mode-sequence"]').setValue(true)
    await w.find('[data-test="batch-sym-ean13"]').setValue(true)
    await flushPromises()
    expect($(w, 'seq-gtin-hint').text()).toContain('12 位數字')
  })
})

describe('內容範本', () => {
  it('沒有 {編號} 時說明原因並擋下載；有的話顯示第一張的內容', async () => {
    const w = mount(BatchTool, opts)
    await paste(w, 'TP 0001\nTP 0002')
    await $(w, 'batch-template').setValue('https://example.com/asset/')
    await flushPromises()
    expect($(w, 'batch-template-error').text()).toContain('{編號}')
    expect($(w, 'batch-download').attributes('disabled')).toBeDefined()
    await $(w, 'batch-insert-token').trigger('click')
    await flushPromises()
    expect($(w, 'batch-template-example').text()).toContain('https://example.com/asset/TP%200001')
    expect($(w, 'batch-download').attributes('disabled')).toBeUndefined()
  })
})

describe('下載 ZIP 與隱私', () => {
  it('鍵盤操作：產生途中焦點在「取消」，結束後回到下載鈕，不會掉到頁面最上面', async () => {
    let release!: () => void
    gate.hold = new Promise<void>((r) => { release = r })
    const w = mount(BatchTool, { ...opts, attachTo: document.body })
    await w.find('[data-test="batch-format-svg"]').setValue(true)
    await paste(w, 'A001\nA002')
    const btn = $(w, 'batch-download').element as HTMLButtonElement
    btn.focus()
    await $(w, 'batch-download').trigger('click')
    await flushPromises()
    // 產生途中下載鈕不能按（瀏覽器會把焦點丟到 body），焦點要在「取消」
    expect(btn.disabled).toBe(true)
    expect(document.activeElement).toBe($(w, 'batch-cancel').element)
    release()
    await vi.waitFor(() => expect(saved).toHaveLength(1))
    await flushPromises()
    // 「取消」消失之後焦點回到下載鈕
    expect($(w, 'batch-cancel').exists()).toBe(false)
    expect(btn.disabled).toBe(false)
    expect(document.activeElement).toBe(btn)
    w.unmount()
  })

  it('SVG：打包全部可以產生的列，檔名去重；GA 只收到級距、碼制、格式；什麼都沒寫進儲存空間或網址', async () => {
    const gtag = vi.fn()
    Object.assign(window, { gtag })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const href = location.href
    const historyLength = history.length

    const w = mount(BatchTool, opts)
    await w.find('[data-test="batch-format-svg"]').setValue(true)
    await paste(w, '會員 0001\n會員 0002\n會員 0001')
    await $(w, 'batch-download').trigger('click')
    await flushPromises()
    await vi.waitFor(() => expect(saved).toHaveLength(1))

    expect(saved[0]!.name).toBe('qrcode-batch-3.zip')
    const files = readZip(new Uint8Array(await saved[0]!.blob.arrayBuffer()))
    expect(files.map(f => f.name)).toEqual(['會員 0001.svg', '會員 0002.svg', '會員 0001 (2).svg'])
    expect($(w, 'batch-status').text()).toContain('已下載 3 張 SVG')

    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'batch_download', { count_range: '1-10', symbology: 'qr', output: 'svg' })
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('會員')

    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
    expect(document.cookie).toBe('')
    expect(location.href).toBe(href)
    expect(history.length).toBe(historyLength)
  })
})
