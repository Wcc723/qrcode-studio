import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { Options as QrOptions } from 'qr-code-styling'
import type { QrStyleOptions } from '@/types'
import { exceedsQrCapacity } from '@/pure/qrCapacity'
import { toQrByteString } from '@/pure/qrByteString'
import { saveBlob } from '@/utils/save-blob'

/** 把帶透明的 PNG 疊到白底上，輸出 JPEG（品質 0.92，與 canvas 預設相同）。瀏覽器不支援時回 null。 */
export async function flattenToJpeg(png: Blob, background = '#ffffff'): Promise<Blob | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null
  const bitmap = await createImageBitmap(png)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close?.()
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92))
}

export function mapToQrOptions(data: string, s: QrStyleOptions): QrOptions {
  const bg = s.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : s.bgColor
  const opts: QrOptions = {
    width: s.width,
    height: s.width,
    type: 'canvas',
    // 非 ASCII（中文、emoji）要先轉成 UTF-8 位元組字串，原因見 qrByteString.ts。
    data: toQrByteString(data || ' '),
    margin: s.margin,
    qrOptions: { errorCorrectionLevel: s.errorCorrectionLevel },
    dotsOptions: { color: s.dotColor, type: 'square' },
    backgroundOptions: { color: bg },
  }
  if (s.useGradient) {
    opts.dotsOptions!.gradient = {
      type: s.gradientType,
      rotation: 0,
      colorStops: [
        { offset: 0, color: s.dotColor },
        { offset: 1, color: s.gradientColor },
      ],
    }
  }
  if (s.logoDataUrl) {
    opts.image = s.logoDataUrl
    opts.imageOptions = { crossOrigin: 'anonymous', margin: 4, imageSize: s.logoSize, hideBackgroundDots: true }
  }
  return opts
}

export function useQrCode(data: Ref<string>, style: Ref<QrStyleOptions>) {
  const container = ref<HTMLElement | null>(null)
  const error = ref<string | null>(null)
  let instance: import('qr-code-styling').default | null = null

  async function ensureInstance() {
    if (instance || typeof window === 'undefined') return
    const { default: QRCodeStyling } = await import('qr-code-styling')
    instance = new QRCodeStyling(mapToQrOptions(data.value, style.value))
    if (container.value) instance.append(container.value)
  }

  function update() {
    if (exceedsQrCapacity(data.value, style.value.errorCorrectionLevel)) {
      error.value = '內容過長，超出 QR Code 容量。請縮短內容，或調低容錯等級。'
      return
    }
    error.value = null
    instance?.update(mapToQrOptions(data.value, style.value))
  }

  onMounted(async () => {
    await ensureInstance()
    update()
  })

  watch([data, style], () => update(), { deep: true })

  onBeforeUnmount(() => { instance = null })

  async function download(extension: 'png' | 'svg' | 'jpeg') {
    await ensureInstance()
    if (error.value) return
    // JPG 沒有透明：畫布上透明的地方編成 JPEG 會變成黑色，深色的方塊壓在黑底上就掃不出來。
    // 透明背景時先輸出 PNG、疊到白底上再轉 JPG。PNG 與 SVG 照常保留透明。
    if (extension === 'jpeg' && style.value.bgColor === 'transparent' && instance) {
      const raw = await instance.getRawData('png')
      const jpg = raw instanceof Blob ? await flattenToJpeg(raw) : null
      if (jpg) { saveBlob(jpg, 'qrcode.jpeg'); return }
    }
    instance?.download({ name: 'qrcode', extension })
  }

  async function copyImage(): Promise<boolean> {
    await ensureInstance()
    if (!instance || error.value) return false
    try {
      const raw = await instance.getRawData('png')
      if (!raw) return false
      // In browser, getRawData returns a Blob; in Node it returns a Buffer.
      // Guard: only use Clipboard API in a browser context.
      if (typeof window === 'undefined') return false
      if (!navigator.clipboard || typeof (window as Window & typeof globalThis & { ClipboardItem?: unknown }).ClipboardItem === 'undefined') return false
      const blob = raw instanceof Blob ? raw : new Blob([new Uint8Array(raw as unknown as Buffer)], { type: 'image/png' })
      const ClipboardItemCtor = (window as Window & typeof globalThis & { ClipboardItem: typeof ClipboardItem }).ClipboardItem
      await navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blob })])
      return true
    } catch {
      return false
    }
  }

  return { container, download, copyImage, error }
}
