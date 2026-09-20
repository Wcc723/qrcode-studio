/**
 * 「用此內容重新產生」的一次性交棒。**只存在於這個分頁的記憶體裡。**
 *
 * 為什麼不用 query string、hash、localStorage 或 sessionStorage：解碼出來的內容
 * 可能是 WiFi 密碼、手機號碼或整張名片。塞進網址會被瀏覽器歷史、分頁標題、
 * 以及任何帶 Referer 的後續請求帶走；塞進 storage 會留在裝置上直到有人清掉。
 * 模組層級變數在重新整理與關閉分頁時一起消失，而且取用一次就清掉，
 * 不會被第二個頁面重複吃到。
 *
 * 代價是重新整理目標頁就沒有內容了。這是刻意的：要保留就該由使用者自己再掃一次。
 */
import type { QrType } from '@/types'
import type { PayloadInputMap } from '@/pure'
import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { scanFormatToSymbology } from '@/pure/scanFormats'
import type { ScanResult } from '@/pure/scanResult'

export type ScanHandoff =
  | { kind: 'qr'; type: QrType; data: PayloadInputMap[QrType] }
  | { kind: 'barcode'; symbology: BarcodeSymbology; value: string }

let pending: ScanHandoff | null = null

export function putScanHandoff(handoff: ScanHandoff): void {
  pending = handoff
}

/** 取用一次就清掉。目標頁 mount 時呼叫，之後重新整理不會再拿到同一筆。 */
export function takeScanHandoff(): ScanHandoff | null {
  const current = pending
  pending = null
  return current
}

export function clearScanHandoff(): void {
  pending = null
}

export function buildScanHandoff(result: ScanResult): ScanHandoff | null {
  const symbology = scanFormatToSymbology(result.format)
  if (symbology) return { kind: 'barcode', symbology, value: result.text }
  if (!result.parsed) return null
  return { kind: 'qr', type: result.parsed.kind, data: result.parsed.data as PayloadInputMap[QrType] }
}

const QR_ROUTES: Record<QrType, string> = {
  url: '/url/', wifi: '/wifi/', vcard: '/vcard/', text: '/text/',
  email: '/email/', phone: '/phone/', sms: '/sms/',
}

/** 站內路徑，不帶 /qrcode-studio 前綴：前綴一律由 router base 提供。 */
export function scanHandoffRoute(handoff: ScanHandoff): string {
  return handoff.kind === 'barcode' ? '/barcode/' : QR_ROUTES[handoff.type]
}
