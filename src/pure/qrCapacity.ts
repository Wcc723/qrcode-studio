import type { ErrorCorrectionLevel } from '@/types'

// QR version-40 byte-mode max capacity per EC level (bytes)
const MAX_BYTES: Record<ErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
}

export function qrByteLength(data: string): number {
  return new TextEncoder().encode(data).length
}

export function exceedsQrCapacity(data: string, ec: ErrorCorrectionLevel): boolean {
  return qrByteLength(data) > MAX_BYTES[ec]
}
