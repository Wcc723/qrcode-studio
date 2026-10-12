import { describe, it, expect, vi, afterEach } from 'vitest'
import { exportZip, BatchExportError, type ExportItem } from './batch-export'
import { artifactSvg, type ArtifactSettings } from '@/pure/batch/artifact'
import { readZip } from '../../test/helpers/zip'

const qr: ArtifactSettings = { symbology: 'qr', ec: 'M', qrSize: 300, barcodeScale: 4 }
const items = (n: number): ExportItem[] =>
  Array.from({ length: n }, (_, i) => ({ normalized: `https://example.com/asset/TP-${String(i + 1).padStart(4, '0')}`, name: `TP-${i + 1}.svg` }))

async function unzip(blob: Blob) {
  expect(blob.type).toBe('application/zip')
  return readZip(new Uint8Array(await blob.arrayBuffer()))
}

afterEach(() => { vi.restoreAllMocks() })

describe('exportZip：SVG', () => {
  it('照順序打包，檔名與內容跟 artifactSvg 一樣，進度最後是全部', async () => {
    const list = items(120)
    const progress: number[] = []
    const files = await unzip(await exportZip(list, { ...qr, format: 'svg', onProgress: (done, total) => { progress.push(done); expect(total).toBe(120) } }))
    expect(files.map(f => f.name)).toEqual(list.map(i => i.name))
    const dec = new TextDecoder()
    expect(dec.decode(files[7]!.data)).toBe(artifactSvg(list[7]!.normalized, qr))
    expect(progress.at(-1)).toBe(120)
  })

  it('一維條碼的 SVG 帶毫米尺寸', async () => {
    const files = await unzip(await exportZip([{ normalized: '4710088331236', name: 'a.svg' }], { ...qr, symbology: 'ean13', format: 'svg' }))
    expect(new TextDecoder().decode(files[0]!.data)).toMatch(/<svg[^>]+width="[\d.]+mm"/)
  })

  it('開始前就取消：丟 AbortError，不產生任何東西', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(exportZip(items(5), { ...qr, format: 'svg', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('做到一半取消：停在下一張開始前，不會做完', async () => {
    const controller = new AbortController()
    let stoppedAt = 0
    const run = exportZip(items(600), {
      ...qr, format: 'svg', signal: controller.signal,
      onProgress: (done) => { if (!stoppedAt) { stoppedAt = done; controller.abort() } },
    })
    await expect(run).rejects.toMatchObject({ name: 'AbortError' })
    expect(stoppedAt).toBeGreaterThan(0)
    expect(stoppedAt).toBeLessThan(600)
  })

  it('做不出來的內容丟出看得懂的錯誤', async () => {
    await expect(exportZip([{ normalized: '中'.repeat(3000), name: 'x.svg' }], { ...qr, format: 'svg' }))
      .rejects.toThrow(BatchExportError)
  })
})

describe('exportZip：PNG', () => {
  /** 假的 canvas：記下每次 toBlob 時畫布的大小與填了幾個矩形，當成檔案內容 */
  function fakeCanvas() {
    let fills = 0
    const ctx = {
      fillStyle: '', font: '', textAlign: 'center', imageSmoothingEnabled: true,
      fillRect: () => { fills++ },
      fillText: () => {},
    }
    const canvas = {
      width: 0, height: 0,
      getContext: () => ctx,
      toBlob(cb: (b: Blob | null) => void) {
        const snapshot = `${this.width}x${this.height}:${fills}`
        fills = 0
        // 編碼在背景完成，順序不保證：故意讓偶數張晚一點回來
        setTimeout(() => cb(new Blob([snapshot], { type: 'image/png' })), snapshot.length % 2 ? 0 : 5)
      },
    }
    return canvas
  }

  it('每張照計畫的大小畫，完成順序打亂也照原本的順序進 ZIP', async () => {
    const real = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (tag === 'canvas' ? fakeCanvas() : real(tag))) as typeof document.createElement)
    const list = items(9).map(i => ({ ...i, name: i.name.replace('.svg', '.png') }))
    const files = await unzip(await exportZip(list, { ...qr, format: 'png', qrSize: 600 }))
    expect(files.map(f => f.name)).toEqual(list.map(i => i.name))
    for (const f of files) expect(new TextDecoder().decode(f.data)).toMatch(/^600x600:\d+$/)
  })

  it('瀏覽器不能畫圖時請使用者改下載 SVG', async () => {
    const real = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (tag === 'canvas' ? { getContext: () => null } : real(tag))) as typeof document.createElement)
    await expect(exportZip(items(1), { ...qr, format: 'png' })).rejects.toThrow(/SVG/)
  })

  it('toBlob 拿不到圖（記憶體不足）時丟出看得懂的錯誤', async () => {
    const real = document.createElement.bind(document)
    const canvas = { ...fakeCanvas(), toBlob: (cb: (b: Blob | null) => void) => setTimeout(() => cb(null), 0) }
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (tag === 'canvas' ? canvas : real(tag))) as typeof document.createElement)
    await expect(exportZip(items(6), { ...qr, format: 'png' })).rejects.toThrow(/記憶體不足/)
  })

  it('讀 PNG 內容失敗（記憶體不足）時一樣丟出看得懂的錯誤，不會一直等下去', async () => {
    const real = document.createElement.bind(document)
    const failing = { arrayBuffer: () => Promise.reject(new DOMException('out of memory', 'NotReadableError')) } as unknown as Blob
    const canvas = { ...fakeCanvas(), toBlob: (cb: (b: Blob | null) => void) => setTimeout(() => cb(failing), 0) }
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (tag === 'canvas' ? canvas : real(tag))) as typeof document.createElement)
    for (const n of [1, 6]) {
      await expect(exportZip(items(n), { ...qr, format: 'png' })).rejects.toSatisfy(
        (e: unknown) => e instanceof BatchExportError && /記憶體不足/.test(e.message),
      )
    }
  })

  it('瀏覽器遲遲不交回 PNG 時，取消照樣馬上停', async () => {
    const real = document.createElement.bind(document)
    const canvas = { ...fakeCanvas(), toBlob: () => {} }
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (tag === 'canvas' ? canvas : real(tag))) as typeof document.createElement)
    for (const n of [2, 9]) {
      const controller = new AbortController()
      const run = exportZip(items(n), { ...qr, format: 'png', signal: controller.signal })
      setTimeout(() => controller.abort(), 10)
      await expect(run).rejects.toMatchObject({ name: 'AbortError' })
    }
  })
})
