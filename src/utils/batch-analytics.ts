/**
 * 批次產生的使用統計：只送「大概幾筆」「哪一種碼」「輸出方式（下載 SVG、PNG，或印成 A4 標籤紙）」三個字面值。
 * 清單內容、檔名、範本、標籤紙型號、筆數的確切數字一律不送。
 *
 * GA 只在正式主機載入（index.html 那段 inline script），其他主機上 window.gtag 不存在，這裡就什麼都不做。
 * 參數的型別都是字面值的聯集，寫成任意字串會編譯不過；src/batch-gates.test.ts 另外掃原始碼，
 * 批次的檔案裡只有這一個檔可以碰 gtag。
 */
import type { BatchSymbology } from '@/pure/batch/rows'

export type BatchCountRange = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001+'
export type BatchOutput = 'svg' | 'png' | 'label'

export interface BatchDownloadEvent {
  count_range: BatchCountRange
  symbology: BatchSymbology
  output: BatchOutput
}

/** 筆數只送級距 */
export function countRange(n: number): BatchCountRange {
  if (n <= 10) return '1-10'
  if (n <= 50) return '11-50'
  if (n <= 200) return '51-200'
  if (n <= 500) return '201-500'
  if (n <= 1000) return '501-1000'
  return '1001+'
}

export function batchDownloadEvent(count: number, symbology: BatchSymbology, output: BatchOutput): BatchDownloadEvent {
  return { count_range: countRange(count), symbology, output }
}

/** 下載成功後、按下「列印標籤」時各送一次 batch_download 事件 */
export function trackBatchDownload(count: number, symbology: BatchSymbology, output: BatchOutput): void {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== 'function') return
  gtag('event', 'batch_download', batchDownloadEvent(count, symbology, output))
}
