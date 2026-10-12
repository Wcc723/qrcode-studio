import { describe, it, expect, afterEach, vi } from 'vitest'
import { countRange, batchDownloadEvent, trackBatchDownload } from './batch-analytics'

afterEach(() => {
  Reflect.deleteProperty(window, 'gtag')
})

describe('批次下載的 GA 事件只送三個字面值', () => {
  it('筆數只送級距', () => {
    expect([1, 10, 11, 50, 51, 200, 201, 500, 501, 1000, 1001, 2000].map(countRange))
      .toEqual(['1-10', '1-10', '11-50', '11-50', '51-200', '51-200', '201-500', '201-500', '501-1000', '501-1000', '1001+', '1001+'])
  })

  it('事件只有筆數級距、碼制、輸出方式三個欄位', () => {
    expect(batchDownloadEvent(137, 'ean13', 'png')).toEqual({ count_range: '51-200', symbology: 'ean13', output: 'png' })
    // 印成 A4 標籤紙：輸出方式是 label，不送型號、起始格、份數或位移
    expect(batchDownloadEvent(24, 'code128', 'label')).toEqual({ count_range: '11-50', symbology: 'code128', output: 'label' })
  })

  it('正式主機上（有 gtag）送一次 batch_download', () => {
    const gtag = vi.fn()
    Object.assign(window, { gtag })
    trackBatchDownload(2000, 'qr', 'svg')
    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'batch_download', { count_range: '1001+', symbology: 'qr', output: 'svg' })
  })

  it('非正式主機（沒有 gtag）什麼都不做', () => {
    expect(() => trackBatchDownload(3, 'qr', 'png')).not.toThrow()
  })
})
