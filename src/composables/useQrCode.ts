import { ref, watch, toValue, onMounted, onBeforeUnmount, type Ref, type MaybeRefOrGetter } from 'vue'
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

/** 內容超過容量時預覽框與縮圖顯示的錯誤 */
export const CAPACITY_ERROR = '內容過長，超出 QR Code 容量。請縮短內容，或把耐髒程度調低。'

type QrLib = typeof import('qr-code-styling')
type QrInstance = InstanceType<QrLib['default']>

/** 套件全頁只載一次，預覽框與縮圖共用；載入失敗就清掉，下次再試 */
let lib: Promise<QrLib> | null = null
function loadLib(): Promise<QrLib> {
  return (lib ??= import('qr-code-styling').catch((e) => { lib = null; throw e }))
}

/**
 * @param draw 畫在頁面上的形式。預設 canvas（預覽框）；手機底部預覽列的縮圖用 svg，
 *   縮成多小都清楚。兩者吃同一份 mapToQrOptions，只差這一欄，內容與外觀一模一樣。
 * @param active false 時不畫（手機預覽列收起來的時候），變動先記著，再變回 true 時補畫一次。
 *   縮圖在打字時（鍵盤開著、預覽列收著）不跟著每個字重畫，輸入才不會卡。
 *
 * 三件事改錯都不會有錯誤訊息，只會讓畫面空白：
 * - qr-code-styling 的建構子會馬上畫一次，內容超過容量就丟例外。所以超過容量時不建，等內容變短再建；
 *   套件自己丟的例外也當成超過容量，下次輸入再試。
 * - 套件只會往最後 append 的那個元素畫。容器元素換掉（v-if 重建）時要把圖搬過去，否則新容器一直是空的；
 *   元件那邊也盡量讓容器一直留著（錯誤用 v-show 或另一個元素蓋上去）。
 */
export function useQrCode(
  data: Ref<string>,
  style: Ref<QrStyleOptions>,
  draw: 'canvas' | 'svg' = 'canvas',
  active: MaybeRefOrGetter<boolean> = true,
) {
  const container = ref<HTMLElement | null>(null)
  const error = ref<string | null>(null)
  let Ctor: QrLib['default'] | null = null
  let instance: QrInstance | null = null
  let mounted = false
  /** 停用期間有變動還沒畫 */
  let stale = true
  const options = (): QrOptions => ({ ...mapToQrOptions(data.value, style.value), type: draw })

  async function load() {
    if (Ctor || typeof window === 'undefined') return
    Ctor = (await loadLib()).default
  }

  /** 照目前的內容與外觀畫一次。同步執行；套件載入之前只更新錯誤狀態。 */
  function update() {
    if (!toValue(active)) { stale = true; return }
    stale = false
    if (exceedsQrCapacity(data.value, style.value.errorCorrectionLevel)) {
      error.value = CAPACITY_ERROR
      return
    }
    error.value = null
    if (!Ctor || !mounted) return
    try {
      if (instance) {
        instance.update(options())
      } else {
        instance = new Ctor(options())
        if (container.value) instance.append(container.value)
      }
    } catch {
      // 容量檢查之外，套件只會因為塞不下而丟例外（code length overflow）
      error.value = CAPACITY_ERROR
    }
  }

  onMounted(async () => {
    mounted = true
    await load()
    if (mounted) update()
  })

  watch([data, style], () => update(), { deep: true })
  watch(() => toValue(active), (on) => { if (on && stale) update() })
  watch(container, (el) => { if (el && instance) instance.append(el) })

  onBeforeUnmount(() => { mounted = false; instance = null })

  /** 下載或複製前：剛掛上、套件還沒載完時先載完並畫好 */
  async function ready(): Promise<QrInstance | null> {
    await load()
    if (!instance) update()
    return error.value ? null : instance
  }

  async function download(extension: 'png' | 'svg' | 'jpeg') {
    const qr = await ready()
    if (!qr) return
    // JPG 沒有透明：畫布上透明的地方編成 JPEG 會變成黑色，深色的方塊壓在黑底上就掃不出來。
    // 透明背景時先輸出 PNG、疊到白底上再轉 JPG。PNG 與 SVG 照常保留透明。
    if (extension === 'jpeg' && style.value.bgColor === 'transparent') {
      const raw = await qr.getRawData('png')
      const jpg = raw instanceof Blob ? await flattenToJpeg(raw) : null
      if (jpg) { saveBlob(jpg, 'qrcode.jpeg'); return }
    }
    qr.download({ name: 'qrcode', extension })
  }

  async function copyImage(): Promise<boolean> {
    const qr = await ready()
    if (!qr) return false
    try {
      const raw = await qr.getRawData('png')
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
