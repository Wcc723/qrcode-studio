/**
 * 圖片檔 → ImageData。只有這一層碰瀏覽器的影像 API。
 *
 * 為什麼一定要自己解成像素、而不是把檔案 bytes 交給 WASM：zxing-wasm 內建的影像
 * 解碼器讀不懂 WebP（會回一筆空結果，看起來就像「這張圖沒有條碼」）。交給瀏覽器
 * 自己的解碼器，PNG／JPEG／WebP 三種容器就走同一條路，而且多拿到一個好處：
 * 在配置 canvas 之前就知道寬高，可以先把解壓縮炸彈擋掉。
 *
 * 尺寸檢查刻意放在 decode 與 toImageData 之間。ImageBitmap 已經是瀏覽器配置的，
 * 但 canvas ＋ getImageData 會再複製一份 4 bytes/px 的 RGBA；40 MP 的圖那份就是
 * 160 MB。先擋再配置，而且不論走哪條路都要 close() 把 ImageBitmap 還掉。
 */
import { checkImageDimensions, ImageInputError } from '@/pure/imageInput'
import type { LoadedImage } from '@/composables/useImageScanner'

export interface BitmapSource {
  readonly width: number
  readonly height: number
  close: () => void
}

export interface BitmapEnv {
  decode: (blob: Blob) => Promise<BitmapSource>
  toImageData: (bitmap: BitmapSource, width: number, height: number) => ImageData
}

export const browserBitmapEnv: BitmapEnv = {
  decode: (blob: Blob) => createImageBitmap(blob),
  toImageData: (bitmap, width, height) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    // willReadFrequently: 我們只讀一次，關掉才不會讓瀏覽器切到較慢的軟體算圖路徑。
    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    if (!ctx) throw new Error('取不到 canvas 2d context')
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0)
    return ctx.getImageData(0, 0, width, height)
  },
}

export async function blobToImageData(blob: Blob, env: BitmapEnv = browserBitmapEnv): Promise<LoadedImage> {
  const bitmap = await env.decode(blob)

  const bounds = checkImageDimensions(bitmap.width, bitmap.height)
  if (!bounds.ok) {
    bitmap.close()
    throw new ImageInputError(bounds.code, bounds.message)
  }

  let imageData: ImageData
  try {
    imageData = env.toImageData(bitmap, bitmap.width, bitmap.height)
  } catch (err) {
    bitmap.close()
    throw err
  }

  // close 要可以重複呼叫：搶先／失敗／正常結束三條路徑都會叫它。
  let closed = false
  return {
    imageData,
    close: () => {
      if (closed) return
      closed = true
      bitmap.close()
    },
  }
}
