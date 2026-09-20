import { describe, it, expect, vi, beforeEach } from 'vitest'
import { effectScope } from 'vue'
import { useImageScanner, type ScanDeps } from './useImageScanner'
import { MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION, ImageInputError } from '@/pure/imageInput'
import type { RawBarcode } from '@/pure/scanResult'

const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0, 0, 0, 0]
const SVG_BYTES = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')

function pngBlob(size = 1024): Blob {
  const bytes = new Uint8Array(size)
  bytes.set(PNG_HEAD)
  const blob = new Blob([bytes], { type: 'image/png' })
  return blob
}

/** 只是個形狀對的 ImageData 替身，內容不重要：真的解碼由黃金測試負責。 */
const fakeImageData = (width = 100, height = 80) =>
  ({ data: new Uint8ClampedArray(width * height * 4), width, height, colorSpace: 'srgb' }) as ImageData

function makeDeps(over: Partial<ScanDeps> = {}) {
  const closed = { count: 0 }
  const revoked: string[] = []
  const created: string[] = []
  let urlSeq = 0
  const deps: ScanDeps = {
    loadImage: vi.fn(async () => ({ imageData: fakeImageData(), close: () => { closed.count++ } })),
    decode: vi.fn(async (): Promise<RawBarcode[]> => [{ format: 'QRCode', text: 'https://example.com/' }]),
    createObjectUrl: vi.fn(() => { const u = `blob:fake/${urlSeq++}`; created.push(u); return u }),
    revokeObjectUrl: vi.fn((u: string) => { revoked.push(u) }),
    ...over,
  }
  return { deps, closed, revoked, created }
}

function runInScope<T>(fn: () => T): { value: T; stop: () => void } {
  const scope = effectScope()
  const value = scope.run(fn)!
  return { value, stop: () => scope.stop() }
}

let harness: ReturnType<typeof makeDeps>
beforeEach(() => { harness = makeDeps() })

describe('初始狀態', () => {
  it('idle，沒有結果也沒有錯誤', () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    expect(s.status.value).toBe('idle')
    expect(s.outcome.value).toBeNull()
    expect(s.error.value).toBeNull()
    expect(s.previewUrl.value).toBeNull()
  })
})

describe('成功解碼', () => {
  it('狀態走到 done 並帶出結果', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(pngBlob())
    expect(s.status.value).toBe('done')
    expect(s.outcome.value?.status).toBe('single')
    expect(s.error.value).toBeNull()
  })

  it('成功之後也要釋放 ImageBitmap，不能只在失敗時釋放', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(pngBlob())
    expect(harness.closed.count).toBe(1)
  })

  it('會建立預覽用的 object URL', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(pngBlob())
    expect(s.previewUrl.value).toBe(harness.created[0])
  })

  it('live region 會拿到可播報的摘要', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(pngBlob())
    expect(s.liveMessage.value).toContain('QR Code')
  })
})

describe('輸入邊界（擋下來就不該動用解碼器）', () => {
  it('超過大小上限', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(pngBlob(MAX_IMAGE_BYTES + 1))
    expect(s.status.value).toBe('error')
    expect(s.error.value).toContain('太大')
    expect(harness.deps.loadImage).not.toHaveBeenCalled()
    expect(harness.deps.decode).not.toHaveBeenCalled()
  })

  it('SVG', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(new Blob([SVG_BYTES], { type: 'image/svg+xml' }))
    expect(s.status.value).toBe('error')
    expect(s.error.value).toContain('SVG')
    expect(harness.deps.loadImage).not.toHaveBeenCalled()
  })

  it('MIME 與檔頭不符', async () => {
    const jpegBytes = new Uint8Array(64)
    jpegBytes.set([0xff, 0xd8, 0xff])
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(new Blob([jpegBytes], { type: 'image/png' }))
    expect(s.status.value).toBe('error')
    expect(harness.deps.decode).not.toHaveBeenCalled()
  })

  it('像素超限：已經解出來的點陣圖仍要釋放', async () => {
    const h = makeDeps({
      loadImage: vi.fn(async () => ({
        imageData: fakeImageData(MAX_IMAGE_DIMENSION + 1, 10),
        close: () => { closedBig.count++ },
      })),
    })
    const closedBig = { count: 0 }
    const { value: s } = runInScope(() => useImageScanner(h.deps))
    await s.scanBlob(pngBlob())
    expect(s.status.value).toBe('error')
    expect(h.deps.decode).not.toHaveBeenCalled()
    expect(closedBig.count).toBe(1)
  })

  it('多檔要擋，且不解碼任何一張', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlobs([pngBlob(), pngBlob()])
    expect(s.status.value).toBe('error')
    expect(s.error.value).toContain('一張')
    expect(harness.deps.loadImage).not.toHaveBeenCalled()
  })
})

describe('解碼失敗', () => {
  it('點陣圖解不開時回錯誤狀態，不是未處理的 rejection', async () => {
    const h = makeDeps({ loadImage: vi.fn(async () => { throw new Error('boom') }) })
    const { value: s } = runInScope(() => useImageScanner(h.deps))
    await expect(s.scanBlob(pngBlob())).resolves.toBeUndefined()
    expect(s.status.value).toBe('error')
  })

  it('點陣圖解析丟出的是輸入邊界錯誤時，要顯示它自己的訊息而不是通用失敗', async () => {
    const h = makeDeps({
      loadImage: vi.fn(async () => { throw new ImageInputError('dimensionTooLarge', '圖片單邊超過上限，請先裁切或縮小。') }),
    })
    const { value: s } = runInScope(() => useImageScanner(h.deps))
    await s.scanBlob(pngBlob())
    expect(s.status.value).toBe('error')
    expect(s.error.value).toContain('裁切')
  })

  it('解碼器丟錯時回錯誤狀態', async () => {
    const h = makeDeps({ decode: vi.fn(async () => { throw new Error('wasm boom') }) })
    const { value: s } = runInScope(() => useImageScanner(h.deps))
    await s.scanBlob(pngBlob())
    expect(s.status.value).toBe('error')
    expect(s.outcome.value).toBeNull()
  })

  it('讀不到條碼是 done ＋ none，不是錯誤', async () => {
    const h = makeDeps({ decode: vi.fn(async () => []) })
    const { value: s } = runInScope(() => useImageScanner(h.deps))
    await s.scanBlob(pngBlob())
    expect(s.status.value).toBe('done')
    expect(s.outcome.value?.status).toBe('none')
  })
})

describe('先後順序與資源釋放', () => {
  it('晚回來的舊結果不得覆蓋新圖的結果', async () => {
    let releaseFirst: (v: RawBarcode[]) => void = () => {}
    let firstDecodeStarted!: () => void
    // 等「第一次解碼真的開始」才丟第二張圖，否則 nextTick 可能還沒走到 decode，
    // 測試會變成在測別的東西（甚至永遠等不到 release）。
    const firstDecoding = new Promise<void>(res => { firstDecodeStarted = res })
    const decode = vi.fn()
      .mockImplementationOnce(() => new Promise<RawBarcode[]>(res => {
        releaseFirst = res
        firstDecodeStarted()
      }))
      .mockImplementationOnce(async () => [{ format: 'Code128', text: 'SECOND' }])
    const h = makeDeps({ decode: decode as unknown as ScanDeps['decode'] })
    const { value: s } = runInScope(() => useImageScanner(h.deps))

    const first = s.scanBlob(pngBlob())
    await firstDecoding
    await s.scanBlob(pngBlob())
    expect(s.outcome.value?.status === 'single' && s.outcome.value.result.text).toBe('SECOND')

    releaseFirst([{ format: 'QRCode', text: 'FIRST' }])
    await first
    expect(s.outcome.value?.status === 'single' && s.outcome.value.result.text).toBe('SECOND')
    expect(s.status.value).toBe('done')
  })

  it('換圖時要 revoke 前一張的 object URL', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(pngBlob())
    const firstUrl = s.previewUrl.value!
    await s.scanBlob(pngBlob())
    expect(harness.revoked).toContain(firstUrl)
    expect(s.previewUrl.value).not.toBe(firstUrl)
  })

  it('scope 結束後：URL 要 revoke，晚回來的結果不得寫入 state', async () => {
    let release: (v: RawBarcode[]) => void = () => {}
    let decodeStarted!: () => void
    const decoding = new Promise<void>(res => { decodeStarted = res })
    const h = makeDeps({
      decode: vi.fn(() => new Promise<RawBarcode[]>(res => { release = res; decodeStarted() })),
    })
    const { value: s, stop } = runInScope(() => useImageScanner(h.deps))

    const pending = s.scanBlob(pngBlob())
    await decoding                 // 確定已經進到解碼中，元件才在「解碼途中」被卸載
    stop()
    expect(h.revoked.length).toBe(1)

    release([{ format: 'QRCode', text: 'LATE' }])
    await pending
    expect(s.outcome.value).toBeNull()
    expect(s.status.value).toBe('working')
  })

  it('reset 會清掉結果與預覽', async () => {
    const { value: s } = runInScope(() => useImageScanner(harness.deps))
    await s.scanBlob(pngBlob())
    s.reset()
    expect(s.status.value).toBe('idle')
    expect(s.outcome.value).toBeNull()
    expect(s.previewUrl.value).toBeNull()
    expect(harness.revoked.length).toBe(1)
  })
})
