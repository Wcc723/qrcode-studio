/**
 * 解碼器回傳值 → UI 狀態模型。零依賴、零 DOM 的純函式。
 *
 * 這一層存在的理由是「多碼圖片不能默默挑第一個」：ZXing 會把一張圖裡的所有碼
 * 都回給你，順序由掃描路徑決定，跟人眼看到的主從關係無關。挑第一個在截圖場景
 * （畫面上同時有優惠券碼與網頁角落的 App 下載 QR）會給出完全錯誤的結果，
 * 而且使用者不會察覺。所以 `multiple` 這個狀態刻意不帶 `result`，
 * 呼叫端在型別上就拿不到任何單一結果可用。
 */
import { toScanFormat, scanFormatLabel, isLinearScanFormat, type ScanFormat } from './scanFormats'
import { parseScanPayload, classifyUri, type ParsedScanPayload, type UriInfo } from './parseScanPayload'

/** 只取我們真正會用到的欄位，不綁 zxing-wasm 的型別，這一層才留得住純函式性質。 */
export interface RawBarcode { format: string; text: string }

export interface ScanResult {
  format: ScanFormat
  formatLabel: string
  text: string
  isLinear: boolean
  /** 只有 QR Code 才做結構化解析；一維碼的內容就是一串編號，硬解只會誤導。 */
  parsed: ParsedScanPayload | null
  uri: UriInfo
}

export type ScanOutcome =
  | { status: 'none' }
  | { status: 'single'; result: ScanResult }
  | { status: 'multiple'; count: number; formatLabels: string[] }
  | { status: 'unsupported'; detectedFormats: string[] }

export function toScanOutcome(rawResults: readonly RawBarcode[]): ScanOutcome {
  // 內容為空的結果不是「讀到一個空白條碼」，而是解碼失敗的回報形式。
  const detected = rawResults.filter(r => r.text !== '')

  // 同一個碼可能被回報多次（例如同時命中不同掃描方向），格式與內容都相同才算重複。
  const seen = new Set<string>()
  const unique = detected.filter(r => {
    const key = `${r.format}\u0000${r.text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (unique.length === 0) return { status: 'none' }

  const supported = unique
    .map(r => ({ raw: r, format: toScanFormat(r.format, r.text) }))
    .filter((r): r is { raw: RawBarcode; format: ScanFormat } => r.format !== null)

  // 一個支援的碼都沒有時，就算讀到好幾個也該說「不支援」而不是「請裁切成單碼」：
  // 裁切之後仍然讀不了，叫使用者白做一次。
  if (supported.length === 0) {
    return { status: 'unsupported', detectedFormats: unique.map(r => r.format) }
  }

  if (unique.length >= 2) {
    return {
      status: 'multiple',
      count: unique.length,
      formatLabels: supported.map(r => scanFormatLabel(r.format)),
    }
  }

  const { raw, format } = supported[0]
  return {
    status: 'single',
    result: {
      format,
      formatLabel: scanFormatLabel(format),
      text: raw.text,
      isLinear: isLinearScanFormat(format),
      parsed: format === 'qrcode' ? parseScanPayload(raw.text) : null,
      uri: classifyUri(raw.text),
    },
  }
}
