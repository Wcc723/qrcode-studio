/**
 * 把任意字串轉成「一個字元＝一個 UTF-8 位元組」的字串，交給 qr-code-styling 編碼。
 *
 * qr-code-styling 內建的 qrcode-generator 在 Byte 模式用 `charCodeAt(i) & 0xff` 把字串
 * 轉成位元組，而且沒有開放選項讓我們改成 UTF-8。結果是中文、emoji 等非 ASCII 字元
 * 只剩低 8 位元：「你好世界」掃出來是一串亂碼，電子名片的中文姓名、中文 WiFi 名稱、
 * 中文簡訊內容全都一樣。
 *
 * 先轉成 UTF-8 位元組、每個位元組當成一個 0–255 的字元，它那個 `& 0xff` 就會
 * 原封不動地還原出正確的 UTF-8 位元組，手機掃出來就是原本的文字。
 *
 * - 純 ASCII 轉換前後完全相同，網址、英文 WiFi 名稱等既有輸出一個位元都不變，
 *   純數字與大寫英數也照樣會被自動選成 Numeric／Alphanumeric 模式。
 * - 用 TextEncoder 而不是 `unescape(encodeURIComponent())`：後者遇到落單的 surrogate
 *   會拋 URIError，TextEncoder 則換成 U+FFFD，不會讓整個預覽壞掉。
 * - 轉換後的長度就是 UTF-8 位元組數，與 `qrCapacity.ts` 的容量檢查同一把尺。
 */
export function toQrByteString(text: string): string {
  let out = ''
  for (const byte of new TextEncoder().encode(text)) out += String.fromCharCode(byte)
  return out
}
