/**
 * 「複製」按鈕的狀態。看起來只是一個 boolean，但有兩個會靜默出錯的地方：
 *
 * 1. **非同步順序**。`navigator.clipboard.writeText()` 是 Promise，使用者按完複製
 *    之後可能馬上換一張圖、切到別的結果。舊那次成功回來時若無條件寫狀態，
 *    畫面會在「新內容」旁邊顯示「已複製」，而剪貼簿裡其實是舊內容。
 *    每次複製配一個遞增 token，回來時對不上就整個丟掉。
 * 2. **卸載後寫狀態**。同一個 Promise 也可能在元件卸載後才回來。
 *
 * clipboard 寫入函式用參數注入：happy-dom 沒有 `navigator.clipboard`，
 * 而這一層真正要測的是順序與清理，不是瀏覽器 API 本身。
 */
import { ref, onScopeDispose, type Ref } from 'vue'

export type ClipboardWrite = ((text: string) => Promise<void>) | null | undefined

export interface CopyTextDeps {
  write: ClipboardWrite
  /** 「已複製」提示停留多久（毫秒）。 */
  resetAfterMs?: number
}

export interface CopyText {
  copied: Ref<boolean>
  error: Ref<string | null>
  copy: (text: string) => Promise<void>
  reset: () => void
}

const FAILED = '複製失敗，請手動選取上方文字。'

function defaultWrite(): ClipboardWrite {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return null
  return (text: string) => navigator.clipboard.writeText(text)
}

export function useCopyText(deps: CopyTextDeps = { write: defaultWrite() }): CopyText {
  const copied = ref(false)
  const error = ref<string | null>(null)
  const resetAfterMs = deps.resetAfterMs ?? 2500

  let token = 0
  let disposed = false
  let timer: ReturnType<typeof setTimeout> | undefined

  function reset() {
    token++
    clearTimeout(timer)
    copied.value = false
    error.value = null
  }

  async function copy(text: string): Promise<void> {
    const id = ++token
    clearTimeout(timer)
    copied.value = false
    error.value = null

    if (!deps.write) {
      if (!disposed && id === token) error.value = FAILED
      return
    }
    try {
      await deps.write(text)
    } catch {
      if (!disposed && id === token) error.value = FAILED
      return
    }
    if (disposed || id !== token) return
    copied.value = true
    timer = setTimeout(() => { if (!disposed && id === token) copied.value = false }, resetAfterMs)
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
  })

  return { copied, error, copy, reset }
}
