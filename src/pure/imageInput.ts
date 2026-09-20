/**
 * 圖片輸入的邊界檢查。零依賴、零 DOM 的純函式，所有拒絕都有機器可讀的原因碼。
 *
 * 為什麼不只看 MIME：拖放與剪貼簿來源的 `type` 可能是空字串，也可能被改副檔名後
 * 由作業系統亂猜。所以宣稱的 MIME 與檔頭 magic bytes 兩邊都要看，不一致就擋。
 *
 * 為什麼要擋 SVG：SVG 是可執行的 XML，能帶 <script> 與外部參照。本工具只做點陣圖
 * 解碼，沒有任何理由把 SVG 交給瀏覽器算圖，所以給它獨立的原因碼、在 UI 說清楚。
 *
 * 像素上限與檔案上限是兩件事：一個 8 MB 的 PNG 可以解壓成數十億像素（解壓縮炸彈），
 * 所以取得寬高之後還要再檢查一次，且必須在配置 canvas 之前。
 */

/** 檔案位元組上限。手機截圖與相機照片都遠小於此，12 MiB 已相當寬鬆。 */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024
/** 總像素上限（約 40 MP）。超過就不是「截圖或照片」，而是要吃掉分頁記憶體的輸入。 */
export const MAX_IMAGE_PIXELS = 40_000_000
/** 單邊上限。極端長條圖的總像素可能不大，但仍會讓解碼器做無謂的掃描。 */
export const MAX_IMAGE_DIMENSION = 12_000

export type ImageKind = 'png' | 'jpeg' | 'webp'

export type ImageRejectCode =
  | 'empty' | 'tooLarge' | 'svgRejected' | 'unsupportedType' | 'mimeMismatch' | 'notImage'
  | 'zeroSize' | 'dimensionTooLarge' | 'tooManyPixels'
  | 'multipleFiles' | 'noFile'

export interface ImageFileMeta { type: string; size: number }

export type CheckResult<T> = ({ ok: true } & T) | { ok: false; code: ImageRejectCode; message: string }

const MIME_TO_KIND: Record<string, ImageKind> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',   // 非標準但部分工具會送
  'image/webp': 'webp',
}

const MESSAGES: Record<ImageRejectCode, string> = {
  empty: '這個檔案是空的，請換一張圖片。',
  tooLarge: `圖片檔案太大（上限 ${MAX_IMAGE_BYTES / 1024 / 1024} MB），請先壓縮或改用截圖。`,
  svgRejected: '不支援 SVG。SVG 是可執行的向量格式，本工具只解碼 PNG、JPEG 與 WebP 點陣圖。',
  unsupportedType: '只支援 PNG、JPEG 與 WebP 圖片，請換一張。',
  mimeMismatch: '這個檔案的內容與副檔名不符，可能已損毀或被改過副檔名。',
  notImage: '讀不出圖片內容，請確認這是 PNG、JPEG 或 WebP 圖片。',
  zeroSize: '圖片的寬或高是 0，可能已損毀。',
  dimensionTooLarge: `圖片單邊超過 ${MAX_IMAGE_DIMENSION} 像素，請先裁切或縮小。`,
  tooManyPixels: '圖片的像素總數太多，請先裁切或縮小再試。',
  multipleFiles: '一次只能解碼一張圖片，請只選一張。',
  noFile: '沒有讀到圖片，請重新選擇。',
}

const fail = (code: ImageRejectCode) => ({ ok: false as const, code, message: MESSAGES[code] })

/**
 * 給「只能用丟的」路徑用的錯誤型別（例如解圖的 adapter，它沒有回傳 CheckResult 的空間）。
 * 帶著原因碼與使用者看得懂的訊息，呼叫端才能把它和「不明的解碼失敗」分開處理。
 */
export class ImageInputError extends Error {
  constructor(public readonly code: ImageRejectCode, message = MESSAGES[code]) {
    super(message)
    this.name = 'ImageInputError'
  }
}

export function imageRejectMessage(code: ImageRejectCode): string {
  return MESSAGES[code]
}

const startsWith = (bytes: Uint8Array, sig: number[]): boolean =>
  bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b)

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIG = [0xff, 0xd8, 0xff]
const RIFF_SIG = [0x52, 0x49, 0x46, 0x46]           // "RIFF"
const WEBP_TAG = [0x57, 0x45, 0x42, 0x50]           // "WEBP"，位在 RIFF 長度欄之後

/** 至少要拿到這麼多位元組才能判定 WebP（RIFF 4 ＋ size 4 ＋ WEBP 4）。 */
export const IMAGE_HEAD_BYTES = 16

export function sniffImageKind(bytes: Uint8Array): ImageKind | null {
  if (startsWith(bytes, PNG_SIG)) return 'png'
  if (startsWith(bytes, JPEG_SIG)) return 'jpeg'
  if (startsWith(bytes, RIFF_SIG) && WEBP_TAG.every((b, i) => bytes[8 + i] === b)) return 'webp'
  return null
}

/** SVG 沒有 magic bytes，只能看開頭是不是 XML／`<svg`。用於擋「改成 .png 的 SVG」。 */
function looksLikeSvg(bytes: Uint8Array): boolean {
  const head = String.fromCharCode(...bytes.slice(0, 64)).trimStart().toLowerCase()
  return head.startsWith('<svg') || head.startsWith('<?xml') || head.startsWith('<!doctype svg')
}

export function checkImageFile(meta: ImageFileMeta, head: Uint8Array): CheckResult<{ kind: ImageKind }> {
  if (meta.size <= 0) return fail('empty')
  if (meta.size > MAX_IMAGE_BYTES) return fail('tooLarge')

  const declared = meta.type.toLowerCase()
  if (declared === 'image/svg+xml' || looksLikeSvg(head)) return fail('svgRejected')

  const kind = sniffImageKind(head)
  if (declared) {
    const declaredKind = MIME_TO_KIND[declared]
    if (!declaredKind) return fail('unsupportedType')
    if (!kind) return fail('mimeMismatch')
    if (kind !== declaredKind) return fail('mimeMismatch')
    return { ok: true, kind }
  }

  if (!kind) return fail('notImage')
  return { ok: true, kind }
}

export function checkImageDimensions(width: number, height: number): CheckResult<Record<never, never>> {
  const valid = (n: number) => Number.isFinite(n) && Number.isInteger(n) && n > 0
  if (!valid(width) || !valid(height)) return fail('zeroSize')
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) return fail('dimensionTooLarge')
  if (width * height > MAX_IMAGE_PIXELS) return fail('tooManyPixels')
  return { ok: true }
}

/** 多檔要明確拒絕而不是默默取第一張：使用者不會知道我們丟掉了哪幾張。 */
export function pickSingleImage<T>(files: readonly T[]): CheckResult<{ file: T }> {
  if (files.length === 0) return fail('noFile')
  if (files.length > 1) return fail('multipleFiles')
  return { ok: true, file: files[0] }
}
