/**
 * 把檢查過的清單做成一包 ZIP（只在瀏覽器裡、只在記憶體裡）。
 *
 * - 分批做：每做一小段就讓出主執行緒一次，進度條才會動、取消鈕才按得到。
 * - 取消：呼叫端 abort 之後，下一張開始前就停，丟出 AbortError，已經做好的檔案全部丟掉。
 * - PNG 用同一張 canvas 一張一張畫。toBlob 在呼叫當下就複製了畫面，所以不必等它編碼完才畫下一張，
 *   同時最多讓 PNG_IN_FLIGHT 張在背景編碼。
 * - 產物不寫進任何儲存空間；ZIP 的 Blob 交給 saveBlob 下載後就由瀏覽器回收。
 */
import { artifactPlan, artifactSvg, type ArtifactSettings } from '@/pure/batch/artifact'
import { paintPlan, type PlanCanvas } from '@/pure/raster'
import { zipParts, type ZipEntry } from '@/pure/batch/zip'

export interface ExportItem {
  /** checkRows 的 normalized */
  normalized: string
  /** ZIP 裡的檔名（已清理、已去重、含副檔名） */
  name: string
}

export interface ExportOptions extends ArtifactSettings {
  format: 'svg' | 'png'
  signal?: AbortSignal
  /** 做完幾張（含這一張）；呼叫端自己決定多久更新一次畫面 */
  onProgress?: (done: number, total: number) => void
}

export class BatchExportError extends Error {
  constructor(message: string) { super(message); this.name = 'BatchExportError' }
}

const PNG_IN_FLIGHT = 4
/** 連續做 SVG 時，每隔這麼久讓出主執行緒一次（毫秒） */
const SLICE_MS = 24

const nextTick = () => new Promise<void>(resolve => setTimeout(resolve, 0))

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('已取消', 'AbortError')
}

function toPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new BatchExportError('瀏覽器沒有畫出圖片，可能是記憶體不足。請減少筆數或改小圖片大小再試一次。')); return }
      resolve(new Uint8Array(await blob.arrayBuffer()))
    }, 'image/png')
  })
}

export async function exportZip(items: readonly ExportItem[], opts: ExportOptions): Promise<Blob> {
  const entries: ZipEntry[] = new Array(items.length)
  const total = items.length
  let done = 0
  const report = () => opts.onProgress?.(done, total)

  if (opts.format === 'svg') {
    const enc = new TextEncoder()
    let sliceStart = performance.now()
    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal)
      const svg = artifactSvg(items[i]!.normalized, opts)
      if (svg === null) throw new BatchExportError(`「${items[i]!.name}」做不出來，請重新檢查內容。`)
      entries[i] = { name: items[i]!.name, data: enc.encode(svg) }
      done++
      if (performance.now() - sliceStart > SLICE_MS) {
        report()
        await nextTick()
        sliceStart = performance.now()
      }
    }
  } else {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new BatchExportError('這個瀏覽器不能畫圖片，請改下載 SVG。')
    const pending = new Set<Promise<void>>()
    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal)
      const plan = artifactPlan(items[i]!.normalized, opts)
      if (plan === null) throw new BatchExportError(`「${items[i]!.name}」做不出來，請重新檢查內容或把圖片大小調大。`)
      canvas.width = plan.width
      canvas.height = plan.height
      paintPlan(ctx as unknown as PlanCanvas, plan)
      const name = items[i]!.name
      const at = i
      const job: Promise<void> = toPngBytes(canvas).then((data) => {
        entries[at] = { name, data }
        done++
        report()
      }).finally(() => pending.delete(job))
      // 失敗由下面的 race／all 丟出來；這裡先接住，同一批其他張再失敗時才不會變成沒人處理的錯誤
      job.catch(() => {})
      pending.add(job)
      if (pending.size >= PNG_IN_FLIGHT) await Promise.race(pending)
    }
    await Promise.all(pending)
    throwIfAborted(opts.signal)
  }

  report()
  return new Blob(zipParts(entries), { type: 'application/zip' })
}
