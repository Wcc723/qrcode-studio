/**
 * zxing-wasm reader 的載入與呼叫。**只在 /scan/ 這條 route 的 chunk 裡被動態載入。**
 *
 * 自架 WASM（不走第三方 CDN）
 * ---------------------------
 * zxing-wasm 3.1.4 內建的 locateFile 預設回傳
 * `https://fastly.jsdelivr.net/npm/zxing-wasm@3.1.4/dist/reader/zxing_reader.wasm`。
 * 那代表使用者的瀏覽器會為了解碼一張本機圖片去連第三方網域：多一個可用性與隱私
 * 的第三方依賴，也讓「圖片不離開瀏覽器」這句話變得需要附註。所以這裡用 Vite 的
 * `?url` 把套件裡的 .wasm 收進本站資產，再以 `locateFile` 覆寫成本站網址。
 *
 * 版本綁定：JS 與 WASM 必須同版，混版會是難查的執行期爆炸。套件自己 export 了
 * `ZXING_WASM_SHA256`，測試拿它和 node_modules 裡的二進位檔對帳。
 *
 * 為什麼 production 一律送 ImageData 而不是檔案 bytes
 * --------------------------------------------------
 * zxing-wasm 內建的影像解碼器讀得懂 PNG 與 JPEG，但**讀不懂 WebP**（實測會回一筆
 * 空結果，看起來就像「這張圖沒有條碼」）。本工具支援 WebP，所以一律先用瀏覽器
 * 自己的解碼器把圖變成像素（createImageBitmap → canvas → ImageData），三種容器
 * 走同一條路；順帶也讓像素上限可以在配置記憶體之前就擋下來。
 */
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import type { ReaderOptions, ZXingModuleOverrides } from 'zxing-wasm/reader'
import { READER_FORMATS } from '@/pure/scanFormats'
import type { RawBarcode } from '@/pure/scanResult'

/** 由 Vite 產出的本站資產網址（/qrcode-studio/assets/zxing_reader-<hash>.wasm）。 */
export const ZXING_WASM_URL: string = wasmUrl

export const READER_OPTIONS: ReaderOptions = {
  formats: [...READER_FORMATS],
  // 截圖與翻拍的圖常常歪斜、反白或縮得很小，這幾個嘗試值得那點時間。
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  // 必須 > 1，否則永遠偵測不到「一張圖裡有多個碼」，就會默默挑到錯的那個。
  // 也不需要無上限：只要足以判定「不只一個」。
  maxNumberOfSymbols: 8,
}

export function selfHostedOverrides(url: string = ZXING_WASM_URL): { locateFile: (path: string, prefix: string) => string } {
  return {
    locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? url : prefix + path),
  }
}

type ReaderModule = typeof import('zxing-wasm/reader')

let modulePromise: Promise<ReaderModule> | null = null

/**
 * 動態 import：reader 的 JS（約 40 KB）與 WASM 都只在使用者真的丟圖進來時才下載，
 * 不會因為有人逛到 /scan/ 就先付這個成本，更不會進到其他頁面的 chunk。
 */
export async function loadZXingReader(overrides: ZXingModuleOverrides = selfHostedOverrides()): Promise<ReaderModule> {
  if (!modulePromise) {
    modulePromise = import('zxing-wasm/reader').then(mod => {
      mod.prepareZXingModule({ overrides })
      return mod
    })
  }
  return modulePromise
}

/**
 * 直接把來源交給 zxing。production 不用這支（WebP 會靜默失敗），
 * 留著是因為黃金測試要用它驗「JPEG 容器 ＋ 我們這組 reader 選項」。
 */
export async function decodeImageSource(
  source: ImageData | Uint8Array | ArrayBuffer | Blob,
  overrides?: ZXingModuleOverrides,
): Promise<RawBarcode[]> {
  const mod = await loadZXingReader(overrides)
  const results = await mod.readBarcodes(source, READER_OPTIONS)
  return results.map(r => ({ format: r.format, text: r.text }))
}

/** production 的解碼入口：只吃已經解成像素的 ImageData。 */
export async function decodeImageData(
  imageData: ImageData,
  overrides?: ZXingModuleOverrides,
): Promise<RawBarcode[]> {
  return decodeImageSource(imageData, overrides)
}
