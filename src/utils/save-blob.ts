/**
 * 觸發瀏覽器下載一個 Blob。
 *
 * QR 那邊靠 qr-code-styling 的 download()，一維條碼沒有對應的東西，所以自己做。
 */
export function saveBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  // Firefox 要求節點在 document 內才會真的觸發下載
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 不能在 click() 之後同步 revoke：部分瀏覽器是非同步去讀那個 blob URL，
  // 撤銷太早會下載到 0 byte 的檔案。延後一拍再回收，避免記憶體洩漏。
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
