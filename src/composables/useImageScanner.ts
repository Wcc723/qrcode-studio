/**
 * /scan/ 的解碼流程協調層：檔案 → 邊界檢查 → 像素 → 解碼 → UI 狀態。
 *
 * 三件事是這一層存在的理由，每一件都在單元測試裡釘住：
 * 1. **先擋再解**。檔案大小、MIME／magic bytes、像素尺寸都要在把圖交給解碼器
 *    之前檢查完。一張 8 MB 的 PNG 可以解壓成數十億像素，等到 canvas 配置下去
 *    才發現就已經太晚。
 * 2. **舊結果不得覆蓋新圖**。使用者連續貼兩張截圖是常態，而解碼是非同步的。
 *    每次掃描配一個遞增的 runId，回來時對不上就整個丟掉（連資源一起釋放）。
 * 3. **資源一定要還**。ImageBitmap 與 object URL 都不是 GC 馬上會收的東西；
 *    成功、失敗、被搶先、元件卸載四條路徑都要釋放。
 *
 * 相依性用參數注入：瀏覽器那三個 API（createImageBitmap / canvas / URL）在
 * happy-dom 裡沒有實作，注入之後這一層的先後順序與釋放時機才測得到。
 * 真正的解碼正確性由 src/utils/zxing-reader.test.ts 的黃金測試負責。
 */
import { ref, shallowRef, onScopeDispose, type Ref } from 'vue'
import {
  IMAGE_HEAD_BYTES, checkImageFile, checkImageDimensions, pickSingleImage, ImageInputError,
} from '@/pure/imageInput'
import { toScanOutcome, type ScanOutcome, type RawBarcode } from '@/pure/scanResult'

export interface LoadedImage {
  imageData: ImageData
  /** 釋放底層的 ImageBitmap／canvas。呼叫端一定要叫，而且只叫一次。 */
  close: () => void
}

export interface ScanDeps {
  loadImage: (blob: Blob) => Promise<LoadedImage>
  decode: (imageData: ImageData) => Promise<RawBarcode[]>
  createObjectUrl: (blob: Blob) => string
  revokeObjectUrl: (url: string) => void
}

export type ScanStatus = 'idle' | 'working' | 'done' | 'error'

export interface ImageScanner {
  status: Ref<ScanStatus>
  outcome: Ref<ScanOutcome | null>
  error: Ref<string | null>
  previewUrl: Ref<string | null>
  liveMessage: Ref<string>
  scanBlob: (blob: Blob) => Promise<void>
  scanBlobs: (blobs: readonly Blob[]) => Promise<void>
  reset: () => void
}

const DECODE_FAILED = '這張圖沒辦法解讀，可能已損毀或不是支援的圖片格式。'

function describeOutcome(outcome: ScanOutcome): string {
  switch (outcome.status) {
    case 'single': return `讀到一個 ${outcome.result.formatLabel}。`
    case 'multiple': return `這張圖裡有 ${outcome.count} 個條碼，請裁切成只剩一個再試。`
    case 'unsupported': return '讀到條碼，但格式不在本工具支援的範圍內。'
    case 'none': return '沒有在這張圖裡讀到條碼。'
  }
}

export function useImageScanner(deps: ScanDeps): ImageScanner {
  const status = ref<ScanStatus>('idle')
  const outcome = shallowRef<ScanOutcome | null>(null)
  const error = ref<string | null>(null)
  const previewUrl = ref<string | null>(null)
  const liveMessage = ref('')

  let runId = 0
  let disposed = false

  function revokePreview() {
    if (previewUrl.value) {
      deps.revokeObjectUrl(previewUrl.value)
      previewUrl.value = null
    }
  }

  function fail(message: string, id: number) {
    if (disposed || id !== runId) return
    status.value = 'error'
    error.value = message
    outcome.value = null
    liveMessage.value = message
  }

  function reset() {
    runId++                 // 讓仍在飛的掃描回來時對不上，直接被丟掉
    revokePreview()
    status.value = 'idle'
    outcome.value = null
    error.value = null
    liveMessage.value = ''
  }

  async function scanBlob(blob: Blob): Promise<void> {
    const id = ++runId
    revokePreview()
    status.value = 'working'
    error.value = null
    outcome.value = null
    liveMessage.value = '解碼中…'

    let head: Uint8Array
    try {
      head = new Uint8Array(await blob.slice(0, IMAGE_HEAD_BYTES).arrayBuffer())
    } catch {
      return fail(DECODE_FAILED, id)
    }
    if (disposed || id !== runId) return

    const fileCheck = checkImageFile({ type: blob.type, size: blob.size }, head)
    if (!fileCheck.ok) return fail(fileCheck.message, id)

    // 預覽網址在確定要解這張圖之後才建立，被邊界擋下來的輸入不會留下要回收的東西。
    const url = deps.createObjectUrl(blob)
    if (disposed || id !== runId) { deps.revokeObjectUrl(url); return }
    previewUrl.value = url

    let loaded: LoadedImage
    try {
      loaded = await deps.loadImage(blob)
    } catch (err) {
      // 解圖那一層已經判定過輸入邊界（例如像素太多）時，用它的說法；
      // 只有真的不明的失敗才退回通用訊息。
      return fail(err instanceof ImageInputError ? err.message : DECODE_FAILED, id)
    }
    // 被新的掃描搶先時，這張圖的資源要在這裡就還掉，否則永遠沒人收。
    if (disposed || id !== runId) { loaded.close(); return }

    const { imageData } = loaded
    const sizeCheck = checkImageDimensions(imageData.width, imageData.height)
    if (!sizeCheck.ok) {
      loaded.close()
      return fail(sizeCheck.message, id)
    }

    let raw: RawBarcode[]
    try {
      raw = await deps.decode(imageData)
    } catch {
      return fail(DECODE_FAILED, id)
    } finally {
      // 成功、失敗、被搶先都走這裡：解碼器不會接手這份點陣圖的所有權，
      // 而且只能還一次，所以 catch 裡刻意不再叫一次 close()。
      loaded.close()
    }
    if (disposed || id !== runId) return

    const result = toScanOutcome(raw)
    status.value = 'done'
    outcome.value = result
    error.value = null
    liveMessage.value = describeOutcome(result)
  }

  async function scanBlobs(blobs: readonly Blob[]): Promise<void> {
    const picked = pickSingleImage(blobs)
    if (!picked.ok) {
      const id = ++runId
      revokePreview()
      return fail(picked.message, id)
    }
    return scanBlob(picked.file)
  }

  onScopeDispose(() => {
    disposed = true
    revokePreview()
  })

  return { status, outcome, error, previewUrl, liveMessage, scanBlob, scanBlobs, reset }
}
