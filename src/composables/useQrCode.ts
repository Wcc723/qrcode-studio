import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { Options as QrOptions } from 'qr-code-styling'
import type { QrStyleOptions } from '@/types'

export function mapToQrOptions(data: string, s: QrStyleOptions): QrOptions {
  const bg = s.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : s.bgColor
  const opts: QrOptions = {
    width: s.width,
    height: s.width,
    type: 'canvas',
    data: data || ' ',
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
  let instance: import('qr-code-styling').default | null = null

  async function ensureInstance() {
    if (instance || typeof window === 'undefined') return
    const { default: QRCodeStyling } = await import('qr-code-styling')
    instance = new QRCodeStyling(mapToQrOptions(data.value, style.value))
    if (container.value) instance.append(container.value)
  }

  function update() {
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
    instance?.download({ name: 'qrcode', extension })
  }

  return { container, download }
}
