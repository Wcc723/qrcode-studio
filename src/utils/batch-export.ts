/**
 * 把檢查過的清單做成一包 ZIP（只在瀏覽器裡、只在記憶體裡）。
 *
 * - 分批做：每做一小段就讓出主執行緒一次，進度條才會動、取消鈕才按得到。
 * - 取消：呼叫端 abort 之後，下一張開始前就停（等背景編碼時也是），丟出 AbortError，已經做好的檔案全部丟掉。
 * - PNG 用同一張 canvas 一張一張畫。toBlob 在呼叫當下就複製了畫面，所以不必等它編碼完才畫下一張，
 *   同時最多讓 PNG_IN_FLIGHT 張在背景編碼。
 * - 產物不寫進任何儲存空間；ZIP 的 Blob 交給 saveBlob 下載後就由瀏覽器回收。
 */
import { artifactPlan, artifactSvg, type ArtifactSettings } from '@/pure/batch/artifact'
import { paintPlan, type PlanCanvas } from '@/pure/raster'
import { zipParts, type ZipEntry } from '@/pure/batch/zip'
import type { Locale } from '@/i18n/locale'

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
  /** 錯誤訊息的語言，預設繁中 */
  locale?: Locale
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

const MESSAGES: Record<Locale, { outOfMemory: string; svgFailed: (name: string) => string; noCanvas: string; pngFailed: (name: string) => string }> = {
  'zh-TW': {
    outOfMemory: '瀏覽器沒有畫出圖片，可能是記憶體不足。請減少筆數或改小圖片大小再試一次。',
    svgFailed: name => `「${name}」做不出來，請重新檢查內容。`,
    noCanvas: '這個瀏覽器不能畫圖片，請改下載 SVG。',
    pngFailed: name => `「${name}」做不出來，請重新檢查內容或把圖片大小調大。`,
  },
  en: {
    outOfMemory: 'The browser did not draw the images, probably because it ran out of memory. Try fewer items or a smaller image size.',
    svgFailed: name => `"${name}" could not be made. Check its content.`,
    noCanvas: 'This browser cannot draw images. Download SVG instead.',
    pngFailed: name => `"${name}" could not be made. Check its content or choose a larger image size.`,
  },
}

/**
 * 每一條失敗的路都要 reject：toBlob 回 null、讀 Blob 失敗（例如記憶體不足）都算。
 * 少一條，外層就永遠等不到結果，畫面會一直停在「正在產生」。
 */
function toPngBytes(canvas: HTMLCanvasElement, outOfMemory: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new BatchExportError(outOfMemory)); return }
      blob.arrayBuffer().then(
        buf => resolve(new Uint8Array(buf)),
        () => reject(new BatchExportError(outOfMemory)),
      )
    }, 'image/png')
  })
}

/** 等背景編碼時也聽取消：瀏覽器的 toBlob 遲遲不回來，按「取消」還是馬上停 */
function unlessAborted<T>(task: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return task
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('已取消', 'AbortError'))
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
    // 一律接住 task：先取消的話它之後再失敗，也不會變成沒人處理的錯誤
    task.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}

export async function exportZip(items: readonly ExportItem[], opts: ExportOptions): Promise<Blob> {
  const m = MESSAGES[opts.locale ?? 'zh-TW']
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
      if (svg === null) throw new BatchExportError(m.svgFailed(items[i]!.name))
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
    if (!ctx) throw new BatchExportError(m.noCanvas)
    const pending = new Set<Promise<void>>()
    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal)
      const plan = artifactPlan(items[i]!.normalized, opts)
      if (plan === null) throw new BatchExportError(m.pngFailed(items[i]!.name))
      canvas.width = plan.width
      canvas.height = plan.height
      paintPlan(ctx as unknown as PlanCanvas, plan)
      const name = items[i]!.name
      const at = i
      const job: Promise<void> = toPngBytes(canvas, m.outOfMemory).then((data) => {
        entries[at] = { name, data }
        done++
        report()
      }).finally(() => pending.delete(job))
      // 失敗由下面的 race／all 丟出來；這裡先接住，同一批其他張再失敗時才不會變成沒人處理的錯誤
      job.catch(() => {})
      pending.add(job)
      if (pending.size >= PNG_IN_FLIGHT) await unlessAborted(Promise.race(pending), opts.signal)
    }
    await unlessAborted(Promise.all(pending), opts.signal)
    throwIfAborted(opts.signal)
  }

  report()
  return new Blob(zipParts(entries), { type: 'application/zip' })
}
