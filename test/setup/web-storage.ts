/**
 * 測試裡的 localStorage／sessionStorage 一律用 happy-dom 的記憶體版本。
 *
 * Node 25 起全域本來就有 localStorage 與 sessionStorage（沒給 `--localstorage-file` 時
 * 是一個沒有 length、setItem 的空物件）。vitest 的 happy-dom 環境遇到全域已經有的名字
 * 就不覆蓋，測試讀到的會變成 Node 那一份：`localStorage.length` 是 undefined，
 * 監聽 `Storage.prototype.setItem` 也攔不到任何寫入，「內容不寫進儲存空間」的測試就失準了。
 *
 * 所以每個測試檔開始前都換上一份新的 happy-dom Storage（只在有 document 的環境），
 * 檔案跑完再還原。Node 22 與 25 跑出來的行為一樣，也不會去碰 Node 那一份而印出警告。
 */
import { afterAll } from 'vitest'

const KEYS = ['localStorage', 'sessionStorage'] as const

if (typeof document !== 'undefined') {
  const originals = KEYS.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const)

  for (const key of KEYS) {
    const storage = new Storage()
    Object.defineProperty(globalThis, key, { get: () => storage, configurable: true, enumerable: true })
  }

  afterAll(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  })
}
