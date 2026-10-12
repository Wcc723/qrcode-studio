/**
 * 觸發瀏覽器下載一個 Blob。
 *
 * QR 那邊靠 qr-code-styling 的 download()，一維條碼沒有對應的東西，所以自己做。
 *
 * `revokeAfterMs`：多久之後回收物件網址。單張圖很小，1 秒綽綽有餘；批次的 ZIP 可能有幾十 MB，
 * Safari 與 iOS 讀大的 Blob 比較慢，回收太早會下載到不完整的檔案，所以呼叫端可以拉長。
 */
export function saveBlob(blob: Blob, filename: string, revokeAfterMs = 1000): void {
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
  setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs)
}
