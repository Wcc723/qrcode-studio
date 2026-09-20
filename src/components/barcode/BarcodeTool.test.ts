import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import BarcodeTool from './BarcodeTool.vue'
import { putScanHandoff, takeScanHandoff, clearScanHandoff } from '@/utils/scan-handoff'

async function type(wrapper: ReturnType<typeof mount>, value: string) {
  await wrapper.find('[data-test="bc-value"]').setValue(value)
  await nextTick()
}

describe('BarcodeTool', () => {
  it('預設是 Code 128，五種類型都有 radio', () => {
    const w = mount(BarcodeTool)
    for (const s of ['code128', 'ean13', 'ean8', 'code39', 'itf14']) {
      expect(w.find(`[data-test="bc-radio-${s}"]`).exists()).toBe(true)
    }
    expect((w.find('[data-test="bc-radio-code128"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('未輸入時不顯示錯誤，下載鍵停用', () => {
    const w = mount(BarcodeTool)
    expect(w.find('[data-test="bc-error"]').exists()).toBe(false)
    expect(w.find('[data-test="dl-png"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="dl-svg"]').attributes('disabled')).toBeDefined()
  })

  it('有效的 Code 128 會產生 SVG 預覽並啟用下載', async () => {
    const w = mount(BarcodeTool)
    await type(w, 'ABC-12345')
    expect(w.find('[data-test="bc-svg"]').exists()).toBe(true)
    expect(w.find('[data-test="bc-svg"]').html()).toContain('<svg')
    expect(w.find('[data-test="dl-png"]').attributes('disabled')).toBeUndefined()
    expect(w.find('[data-test="dl-svg"]').attributes('disabled')).toBeUndefined()
  })

  it('切換類型會保留輸入並重新驗證（不清空）', async () => {
    const w = mount(BarcodeTool)
    await type(w, '5449000000996')
    await w.find('[data-test="bc-radio-ean13"]').setValue()
    await nextTick()
    expect((w.find('[data-test="bc-value"]').element as HTMLInputElement).value).toBe('5449000000996')
    expect(w.find('[data-test="bc-error"]').exists()).toBe(false)
  })

  it('EAN-13 檢查碼錯誤時顯示明確提示並停用下載', async () => {
    const w = mount(BarcodeTool)
    await w.find('[data-test="bc-radio-ean13"]').setValue()
    await type(w, '5449000000990')
    const err = w.find('[data-test="bc-error"]')
    expect(err.exists()).toBe(true)
    expect(err.text()).toContain('檢查碼不符')
    expect(err.text()).toContain('應該是 6')
    expect(err.text()).toContain('你輸入的是 0')
    expect(w.find('[data-test="dl-png"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="dl-svg"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="bc-svg"]').exists()).toBe(false)
  })

  it('EAN-13 輸入 12 位會告知自動補上的檢查碼與完整號碼', async () => {
    const w = mount(BarcodeTool)
    await w.find('[data-test="bc-radio-ean13"]').setValue()
    await type(w, '544900000099')
    const n = w.find('[data-test="bc-notice"]')
    expect(n.exists()).toBe(true)
    expect(n.text()).toContain('已自動補上檢查碼 6')
    expect(n.text()).toContain('5449000000996')
  })

  it('Code 39 含 $ / + % 時警告 Full ASCII 可能被合併解讀', async () => {
    const w = mount(BarcodeTool)
    await w.find('[data-test="bc-radio-code39"]').setValue()
    await type(w, 'A$E')
    const n = w.find('[data-test="bc-notice"]')
    expect(n.exists()).toBe(true)
    expect(n.text()).toContain('Full ASCII')
  })

  it('Code 39 小寫會轉大寫且不報錯', async () => {
    const w = mount(BarcodeTool)
    await w.find('[data-test="bc-radio-code39"]').setValue()
    await type(w, 'abc-123')
    expect(w.find('[data-test="bc-error"]').exists()).toBe(false)
    expect(w.find('[data-test="bc-svg"]').html()).toContain('ABC-123')
  })

  it('ITF-14 會顯示列印資訊，X 尺寸是 1.016mm', async () => {
    const w = mount(BarcodeTool)
    await w.find('[data-test="bc-radio-itf14"]').setValue()
    await type(w, '15400141288763')
    expect(w.find('[data-test="bc-print-info"]').text()).toContain('1.016')
  })

  it('PNG 解析度三段，切換會更新 DPI 說明', async () => {
    const w = mount(BarcodeTool)
    await type(w, 'ABC-12345')
    const info = () => w.find('[data-test="bc-png-info"]').text()
    expect(info()).toContain('DPI')
    const sel = w.find('[data-test="bc-scale"]')
    expect(sel.findAll('option')).toHaveLength(3)
    await sel.setValue('8')
    await nextTick()
    expect(info()).toContain('616 DPI')   // 8 / 0.33 * 25.4
  })
})

describe('BarcodeTool 無障礙接線', () => {
  it('輸入框 aria-describedby 指到的兩個 id 都真的存在', () => {
    const w = mount(BarcodeTool)
    const ids = w.find('[data-test="bc-value"]').attributes('aria-describedby')!.split(' ')
    expect(ids).toEqual(['bc-hint', 'bc-status'])
    for (const id of ids) expect(w.find(`#${id}`).exists()).toBe(true)
  })

  it('狀態區是 aria-live="polite" 且沒有 role="alert"', () => {
    const w = mount(BarcodeTool)
    const status = w.find('#bc-status')
    expect(status.attributes('aria-live')).toBe('polite')
    expect(status.attributes('role')).toBeUndefined()
  })

  it('狀態區容器永遠存在（live region 必須先存在才會被播報）', async () => {
    const w = mount(BarcodeTool)
    expect(w.find('#bc-status').exists()).toBe(true)
    await type(w, 'ABC')
    expect(w.find('#bc-status').exists()).toBe(true)
  })

  it('錯誤時 aria-invalid 為 true，正常時為 false', async () => {
    const w = mount(BarcodeTool)
    await w.find('[data-test="bc-radio-ean13"]').setValue()
    await type(w, '5449000000990')
    expect(w.find('[data-test="bc-value"]').attributes('aria-invalid')).toBe('true')
    await type(w, '5449000000996')
    expect(w.find('[data-test="bc-value"]').attributes('aria-invalid')).toBe('false')
  })

  it('類型選擇用原生 radio group（同一個 name，瀏覽器提供方向鍵與單一 tab stop）', () => {
    const w = mount(BarcodeTool)
    const radios = w.findAll('input[type="radio"]')
    expect(radios).toHaveLength(5)
    for (const r of radios) expect(r.attributes('name')).toBe('bc-symbology')
  })

  it('fieldset 有 legend，且沒有用 role="tablist"', () => {
    const w = mount(BarcodeTool)
    expect(w.find('fieldset legend').text()).toBe('條碼類型')
    expect(w.find('[role="tablist"]').exists()).toBe(false)
  })

  it('預覽 SVG 以 role="img" 對外，附含內容的 aria-label', async () => {
    const w = mount(BarcodeTool)
    await type(w, 'ABC-12345')
    const svg = w.find('[data-test="bc-svg"]')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Code 128 條碼，內容 ABC-12345')
  })

  it('每個輸入都有可見標籤，沒有拿 placeholder 當標籤', () => {
    const w = mount(BarcodeTool)
    expect(w.find('label').text()).toContain('Code 128')
    const valueLabel = w.findAll('label').find(l => l.text().includes('條碼內容'))
    expect(valueLabel).toBeDefined()
  })
})

describe('BarcodeTool 下載', () => {
  it('按 SVG 會觸發一次下載，檔名 barcode.svg', async () => {
    const clicks: string[] = []
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = origCreate(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: () => clicks.push((el as HTMLAnchorElement).download) })
      }
      return el
    }) as typeof document.createElement)
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })

    const w = mount(BarcodeTool)
    await type(w, 'ABC-12345')
    await w.find('[data-test="dl-svg"]').trigger('click')
    await nextTick()
    expect(clicks).toEqual(['barcode.svg'])
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
})

describe('從 /scan/ 交棒過來的一維碼', () => {
  beforeEach(() => clearScanHandoff())

  it('會設定符號學並填入原始值', async () => {
    putScanHandoff({ kind: 'barcode', symbology: 'ean13', value: '4710088331236' })
    const w = mount(BarcodeTool)
    await nextTick()
    await nextTick()
    expect((w.find('[data-test="bc-radio-ean13"]').element as HTMLInputElement).checked).toBe(true)
    expect((w.find('[data-test="bc-value"]').element as HTMLInputElement).value).toBe('4710088331236')
  })

  it('交棒之後預覽就是同一個號碼', async () => {
    putScanHandoff({ kind: 'barcode', symbology: 'itf14', value: '15400141288763' })
    const w = mount(BarcodeTool)
    await nextTick()
    await nextTick()
    expect(w.find('[data-test="bc-svg"]').exists()).toBe(true)
    expect(w.html()).toContain('15400141288763')
  })

  it('只吃一次', async () => {
    putScanHandoff({ kind: 'barcode', symbology: 'ean13', value: '4710088331236' })
    mount(BarcodeTool)
    await nextTick()
    const second = mount(BarcodeTool)
    await nextTick()
    await nextTick()
    expect((second.find('[data-test="bc-value"]').element as HTMLInputElement).value).toBe('')
  })

  it('QR 的交棒不歸它管，會被丟掉而不是硬塞', async () => {
    putScanHandoff({ kind: 'qr', type: 'url', data: { url: 'https://example.com/a' } })
    const w = mount(BarcodeTool)
    await nextTick()
    await nextTick()
    expect((w.find('[data-test="bc-value"]').element as HTMLInputElement).value).toBe('')
    expect(takeScanHandoff()).toBeNull()
  })

  it('沒有交棒時維持原本的空白行為', async () => {
    const w = mount(BarcodeTool)
    await nextTick()
    expect((w.find('[data-test="bc-value"]').element as HTMLInputElement).value).toBe('')
  })
})
