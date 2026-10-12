/**
 * 「記住這台印表機的位移」：只存左右（X）與上下（Y）兩個數字，放在這台電腦的瀏覽器（localStorage）。
 *
 * 批次的檔案裡只有這一個可以碰瀏覽器的儲存空間（src/batch-gates.test.ts 會掃）：清單、標籤上的字、
 * 型號都不存。使用者沒勾選就不寫，取消勾選就刪掉。讀寫失敗（無痕模式、儲存空間被關掉）時當成沒有記住，不擋列印。
 * 只能在 onMounted 之後讀（預渲染時沒有瀏覽器的儲存空間）。
 */
import { clampOffset } from '@/pure/batch/labelLayout'

export const OFFSET_STORAGE_KEY = 'qrcode-studio-label-offset'

export interface PrinterOffset {
  x: number
  y: number
}

/** 讀出記住的位移；沒有記住、格式不對或讀不到時回 null */
export function loadPrinterOffset(): PrinterOffset | null {
  try {
    const raw = globalThis.localStorage?.getItem(OFFSET_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const { x, y } = parsed as Record<string, unknown>
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null
    return { x: clampOffset(x), y: clampOffset(y) }
  } catch {
    return null
  }
}

/** 記住位移：寫進去的只有 {"x":數字,"y":數字} */
export function savePrinterOffset(x: number, y: number): void {
  const value: PrinterOffset = { x: clampOffset(x), y: clampOffset(y) }
  try {
    globalThis.localStorage?.setItem(OFFSET_STORAGE_KEY, JSON.stringify(value))
  } catch { /* 儲存空間被關掉：這次就不記，列印照常 */ }
}

/** 不再記住：刪掉那一筆 */
export function forgetPrinterOffset(): void {
  try {
    globalThis.localStorage?.removeItem(OFFSET_STORAGE_KEY)
  } catch { /* 同上 */ }
}
