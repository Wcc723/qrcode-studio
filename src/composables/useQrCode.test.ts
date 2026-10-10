import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref, h } from 'vue'
import { defaultStyle, type QrStyleOptions } from '@/types'

/**
 * 透明背景下載 JPG：JPEG 沒有透明，直接把畫布編成 JPEG 時透明的地方會變成黑色，
 * 深色方塊壓在黑底上就掃不出來（實測 Chromium 與 WebKit 都是全黑底）。
 * 所以透明背景的 JPG 要先疊到白底上；PNG、SVG 與不透明的 JPG 照舊交給 qr-code-styling。
 */
const lib = vi.hoisted(() => ({
  download: vi.fn(),
  getRawData: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  options: [] as Record<string, unknown>[],
}))
vi.mock('qr-code-styling', () => ({
  default: class {
    constructor(o: Record<string, unknown>) { lib.options.push(o) }
    append() {}
    update(o: Record<string, unknown>) { lib.options.push(o) }
    download = lib.download
    getRawData = lib.getRawData
  },
}))
const saved = vi.hoisted(() => ({ saveBlob: vi.fn() }))
vi.mock('@/utils/save-blob', () => saved)

import { useQrCode, mapToQrOptions } from './useQrCode'

function setup(style: Partial<QrStyleOptions>, draw?: 'canvas' | 'svg') {
  let api!: ReturnType<typeof useQrCode>
  const Host = defineComponent({
    setup() {
      api = useQrCode(ref('https://example.com'), ref({ ...defaultStyle, ...style }), draw)
      return () => h('div', { ref: api.container })
    },
  })
  mount(Host)
  return () => api
}

const calls: string[] = []
beforeEach(() => {
  calls.length = 0
  lib.options.length = 0
  lib.download.mockClear()
  saved.saveBlob.mockClear()
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 10, height: 10, close() {} })))
  const realCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag !== 'canvas') return realCreate(tag)
    const ctx = {
      set fillStyle(v: string) { calls.push(`fillStyle ${v}`) },
      fillRect: () => calls.push('fillRect'),
      drawImage: () => calls.push('drawImage'),
    }
    return {
      width: 0, height: 0,
      getContext: () => ctx,
      toBlob: (cb: (b: Blob) => void, type: string) => { calls.push(`toBlob ${type}`); cb(new Blob(['jpg'], { type })) },
    }
  }) as typeof document.createElement)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useQrCode 下載', () => {
  it('透明背景下載 JPG：先鋪白底再畫 QR Code，存成 qrcode.jpeg', async () => {
    const api = setup({ bgColor: 'transparent' })
    await flushPromises()
    await api().download('jpeg')
    expect(calls).toEqual(['fillStyle #ffffff', 'fillRect', 'drawImage', 'toBlob image/jpeg'])
    expect(saved.saveBlob).toHaveBeenCalledOnce()
    expect(saved.saveBlob.mock.calls[0][1]).toBe('qrcode.jpeg')
    expect((saved.saveBlob.mock.calls[0][0] as Blob).type).toBe('image/jpeg')
    expect(lib.download).not.toHaveBeenCalled()
  })

  it('透明背景下載 PNG、SVG：照常保留透明，交給 qr-code-styling', async () => {
    const api = setup({ bgColor: 'transparent' })
    await flushPromises()
    await api().download('png')
    await api().download('svg')
    expect(lib.download).toHaveBeenCalledTimes(2)
    expect(saved.saveBlob).not.toHaveBeenCalled()
  })

  it('不透明背景下載 JPG：不必另外處理', async () => {
    const api = setup({ bgColor: '#ffffff' })
    await flushPromises()
    await api().download('jpeg')
    expect(lib.download).toHaveBeenCalledWith({ name: 'qrcode', extension: 'jpeg' })
    expect(saved.saveBlob).not.toHaveBeenCalled()
  })
})

describe('useQrCode 畫法', () => {
  it('預設畫成 canvas（預覽框，下載與複製都從這一份來）', async () => {
    setup({})
    await flushPromises()
    expect(lib.options.length).toBeGreaterThan(0)
    for (const o of lib.options) expect(o.type).toBe('canvas')
  })

  it('手機預覽列的縮圖畫成 svg：除了畫法，內容與外觀跟預覽框完全一樣', async () => {
    const style = { ...defaultStyle, dotColor: '#c2410c', useGradient: true, margin: 12 }
    setup(style, 'svg')
    await flushPromises()
    expect(lib.options.length).toBeGreaterThan(0)
    for (const o of lib.options) {
      expect(o.type).toBe('svg')
      expect({ ...o, type: 'canvas' }).toEqual(mapToQrOptions('https://example.com', style))
    }
  })
})
