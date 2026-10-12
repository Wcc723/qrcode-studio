/**
 * ZIP 裡每張圖的檔名：來自檔名欄、內容本身或流水號。
 * 清掉 Windows 與 macOS 不接受的字元，同一批裡重名的加「 (2)」「 (3)」。
 */

/** 檔名主體最多幾個字（以 Unicode 字元計），避免解壓縮後路徑過長 */
export const MAX_BASE_CHARS = 80

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i
// eslint-disable-next-line no-control-regex
const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001f\u007f]/g

/**
 * 清理檔名主體：NFC、連續空白縮成一個、不合法字元換成底線、去掉頭尾的空白與點、避開保留名稱、限制長度。
 * 清完什麼都不剩時回傳空字串，由呼叫端改用流水號。
 */
export function sanitizeBaseName(base: string): string {
  // 先把換行與 Tab 這類空白縮成一個空格（儲存格裡的換行不該變成底線），再換掉不合法的字元
  let s = base.normalize('NFC').replace(/\s+/g, ' ').replace(INVALID_CHARS, '_')
  s = s.replace(/^[\s.]+|[\s.]+$/g, '')
  const chars = [...s]
  if (chars.length > MAX_BASE_CHARS) s = chars.slice(0, MAX_BASE_CHARS).join('').replace(/[\s.]+$/, '')
  if (!s) return ''
  if (WINDOWS_RESERVED.test(s)) s = `_${s}`
  return s
}

/** 流水號：第 index 筆（0 起算），補零到跟總筆數一樣的位數（至少 3 位），檔案總管照字母排序也是原本的順序 */
export function serialName(index: number, total: number): string {
  return String(index + 1).padStart(Math.max(3, String(total).length), '0')
}

/**
 * 同一批輸出裡避免重名：不分大小寫、NFC 與 NFD 視為同名（Windows 與 macOS 的檔案系統都是這樣），
 * 重名時在副檔名前加「 (2)」「 (3)」…。回傳的名稱會記進 taken。
 */
export function dedupeName(name: string, taken: Set<string>): string {
  const normalized = name.normalize('NFC')
  const key = (s: string) => s.toLowerCase()
  const dot = normalized.lastIndexOf('.')
  const stem = dot > 0 ? normalized.slice(0, dot) : normalized
  const ext = dot > 0 ? normalized.slice(dot) : ''
  let candidate = normalized
  for (let n = 2; taken.has(key(candidate)); n++) candidate = `${stem} (${n})${ext}`
  taken.add(key(candidate))
  return candidate
}
