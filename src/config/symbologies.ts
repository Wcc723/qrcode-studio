import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { CODE39_MAX_LENGTH, CODE128_MAX_LENGTH } from '@/pure/validateBarcode'
import type { Locale } from '@/i18n/locale'
import { pngPresetLabels, symbologyText } from '@/locales/barcode'

export interface SymbologyMeta {
  id: BarcodeSymbology
  label: string
  numericOnly: boolean
  maxLen: number          // 輸入框的 maxlength，連字號與空白也算在內所以放寬
  placeholder: string
  /** 填寫規則（位數、可用字元、檢查碼）：填的當下就要看到，一律顯示在輸入框下方 */
  rule: string
  /** 用途說明：收在「條碼類型」旁的「?」裡，選類型時參考 */
  about: string
}

/** 跟語言無關的部分；用途與規則的字在 src/locales/barcode.ts */
const BASE: Omit<SymbologyMeta, 'rule' | 'about'>[] = [
  { id: 'code128', label: 'Code 128', numericOnly: false, maxLen: CODE128_MAX_LENGTH, placeholder: 'ABC-12345' },
  { id: 'ean13', label: 'EAN-13', numericOnly: true, maxLen: 20, placeholder: '4710088331236' },
  { id: 'ean8', label: 'EAN-8', numericOnly: true, maxLen: 14, placeholder: '55123457' },
  { id: 'code39', label: 'Code 39', numericOnly: false, maxLen: CODE39_MAX_LENGTH, placeholder: 'ABC-1234' },
  { id: 'itf14', label: 'ITF-14', numericOnly: true, maxLen: 20, placeholder: '15400141288763' },
]

/** 某個語言的五種碼制（順序就是畫面上的順序） */
export function symbologiesFor(locale: Locale): SymbologyMeta[] {
  return BASE.map(s => ({ ...s, ...symbologyText[locale][s.id] }))
}

/** 繁中那一份（原本的匯出，批次頁與舊程式照用） */
export const symbologies: SymbologyMeta[] = symbologiesFor('zh-TW')

export const symbologyById = Object.fromEntries(
  symbologies.map(s => [s.id, s]),
) as Record<BarcodeSymbology, SymbologyMeta>

export function symbologyMapFor(locale: Locale): Record<BarcodeSymbology, SymbologyMeta> {
  return Object.fromEntries(symbologiesFor(locale).map(s => [s.id, s])) as Record<BarcodeSymbology, SymbologyMeta>
}

/** PNG 匯出的三段清晰度。只給偶數，讓條的邊界落在整數像素上，避免抗鋸齒灰邊。 */
export interface PngPreset { id: 'web' | 'print' | 'press'; label: string; scale: number }
const PNG_SCALES: Omit<PngPreset, 'label'>[] = [
  { id: 'web', scale: 2 },
  { id: 'print', scale: 4 },
  { id: 'press', scale: 8 },
]
export function pngPresetsFor(locale: Locale): PngPreset[] {
  return PNG_SCALES.map(p => ({ ...p, label: pngPresetLabels[locale][p.id] }))
}
export const pngPresets: PngPreset[] = pngPresetsFor('zh-TW')
