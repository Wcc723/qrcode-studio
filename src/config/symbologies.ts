import type { BarcodeSymbology } from '@/pure/validateBarcode'
import { CODE39_MAX_LENGTH, CODE128_MAX_LENGTH } from '@/pure/validateBarcode'

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

export const symbologies: SymbologyMeta[] = [
  {
    id: 'code128', label: 'Code 128', numericOnly: false, maxLen: CODE128_MAX_LENGTH,
    placeholder: 'ABC-12345',
    about: '物流、倉儲與內部管理最通用。',
    rule: '可放英文、數字與鍵盤上的半形符號，最多 80 個字元。',
  },
  {
    id: 'ean13', label: 'EAN-13', numericOnly: true, maxLen: 20,
    placeholder: '4710088331236',
    about: '零售商品條碼。',
    rule: '最後一位是檢查碼，由前面 12 位算出來，用來抓打錯的號碼。輸入 12 位會自動補上，輸入 13 位會驗證。',
  },
  {
    id: 'ean8', label: 'EAN-8', numericOnly: true, maxLen: 14,
    placeholder: '55123457',
    about: '小包裝零售商品。',
    rule: '最後一位是檢查碼，由前面 7 位算出來，用來抓打錯的號碼。輸入 7 位會自動補上，輸入 8 位會驗證。',
  },
  {
    id: 'code39', label: 'Code 39', numericOnly: false, maxLen: CODE39_MAX_LENGTH,
    placeholder: 'ABC-1234',
    about: '老設備相容性最好，同樣內容會比 Code 128 寬約三成。',
    rule: '只收大寫英文、數字與 - . $ / + % 和半形空白。',
  },
  {
    id: 'itf14', label: 'ITF-14', numericOnly: true, maxLen: 20,
    placeholder: '15400141288763',
    about: '外箱與瓦楞紙箱用，會自動加上規定要有的外框粗線（bearer bar）。',
    rule: '最後一位是檢查碼，由前面 13 位算出來，用來抓打錯的號碼。輸入 13 位會自動補上，輸入 14 位會驗證。',
  },
]

export const symbologyById = Object.fromEntries(
  symbologies.map(s => [s.id, s]),
) as Record<BarcodeSymbology, SymbologyMeta>

/** PNG 匯出的三段清晰度。只給偶數，讓條的邊界落在整數像素上，避免抗鋸齒灰邊。 */
export interface PngPreset { id: string; label: string; scale: number }
export const pngPresets: PngPreset[] = [
  { id: 'web', label: '網頁用', scale: 2 },
  { id: 'print', label: '一般列印', scale: 4 },
  { id: 'press', label: '高品質印刷', scale: 8 },
]
