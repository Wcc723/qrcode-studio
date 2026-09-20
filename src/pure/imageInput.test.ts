import { describe, it, expect } from 'vitest'
import {
  MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS, MAX_IMAGE_DIMENSION,
  sniffImageKind, checkImageFile, checkImageDimensions, pickSingleImage,
} from './imageInput'

const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13])
const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1])
const WEBP_HEAD = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x36, 0x01, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])
const WAV_HEAD = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x08, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
])
const GIF_HEAD = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0])
const SVG_HEAD = new TextEncoder().encode('<svg xmlns="http://ww')

describe('magic bytes 嗅探', () => {
  it('認得 PNG / JPEG / WebP', () => {
    expect(sniffImageKind(PNG_HEAD)).toBe('png')
    expect(sniffImageKind(JPEG_HEAD)).toBe('jpeg')
    expect(sniffImageKind(WEBP_HEAD)).toBe('webp')
  })

  it('RIFF 但不是 WEBP 的不算圖片', () => {
    expect(sniffImageKind(WAV_HEAD)).toBeNull()
  })

  it('其他格式與截斷的檔頭都回 null', () => {
    expect(sniffImageKind(GIF_HEAD)).toBeNull()
    expect(sniffImageKind(SVG_HEAD)).toBeNull()
    expect(sniffImageKind(new Uint8Array([0x89, 0x50]))).toBeNull()
    expect(sniffImageKind(new Uint8Array(0))).toBeNull()
  })
})

describe('檔案邊界檢查', () => {
  it('接受三種支援容器，且回報實際容器種類', () => {
    expect(checkImageFile({ type: 'image/png', size: 1024 }, PNG_HEAD)).toEqual({ ok: true, kind: 'png' })
    expect(checkImageFile({ type: 'image/jpeg', size: 1024 }, JPEG_HEAD)).toEqual({ ok: true, kind: 'jpeg' })
    expect(checkImageFile({ type: 'image/webp', size: 1024 }, WEBP_HEAD)).toEqual({ ok: true, kind: 'webp' })
  })

  it('沒有 MIME 時（部分拖放來源）以 magic bytes 為準', () => {
    expect(checkImageFile({ type: '', size: 1024 }, PNG_HEAD)).toEqual({ ok: true, kind: 'png' })
  })

  it('宣稱的 MIME 與實際 magic bytes 不符要擋下來', () => {
    const r = checkImageFile({ type: 'image/png', size: 1024 }, JPEG_HEAD)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.code).toBe('mimeMismatch')
  })

  it('零位元組檔案回 empty', () => {
    const r = checkImageFile({ type: 'image/png', size: 0 }, new Uint8Array(0))
    expect(r.ok === false && r.code).toBe('empty')
  })

  it('超過大小上限的檔案在讀取前就擋下', () => {
    const r = checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }, PNG_HEAD)
    expect(r.ok === false && r.code).toBe('tooLarge')
    expect(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES }, PNG_HEAD).ok).toBe(true)
  })

  it('SVG 一律拒絕，且有自己的原因碼', () => {
    const byMime = checkImageFile({ type: 'image/svg+xml', size: 512 }, SVG_HEAD)
    expect(byMime.ok === false && byMime.code).toBe('svgRejected')
    // 改名成 .png 也擋得住：MIME 為空時仍會看到 SVG 的檔頭
    const byBytes = checkImageFile({ type: '', size: 512 }, SVG_HEAD)
    expect(byBytes.ok === false && byBytes.code).toBe('svgRejected')
  })

  it('非圖片 MIME 直接回 unsupportedType', () => {
    for (const type of ['application/pdf', 'text/plain', 'image/gif', 'image/avif']) {
      const r = checkImageFile({ type, size: 512 }, GIF_HEAD)
      expect(r.ok === false && r.code).toBe('unsupportedType')
    }
  })

  it('無 MIME 且 magic bytes 不認得時回 notImage', () => {
    const r = checkImageFile({ type: '', size: 512 }, GIF_HEAD)
    expect(r.ok === false && r.code).toBe('notImage')
  })

  it('每個失敗都帶可讀的中文訊息', () => {
    const r = checkImageFile({ type: 'image/svg+xml', size: 512 }, SVG_HEAD)
    expect(r.ok === false && typeof r.message === 'string' && r.message.length > 0).toBe(true)
  })
})

describe('像素尺寸邊界', () => {
  it('正常尺寸通過', () => {
    expect(checkImageDimensions(1000, 800)).toEqual({ ok: true })
  })

  it('零尺寸（解碼失敗常見徵兆）要擋', () => {
    expect(checkImageDimensions(0, 800).ok).toBe(false)
    expect(checkImageDimensions(800, 0).ok).toBe(false)
    const r = checkImageDimensions(0, 0)
    expect(r.ok === false && r.code).toBe('zeroSize')
  })

  it('單邊超過上限要擋（解壓縮炸彈的典型形狀）', () => {
    const r = checkImageDimensions(MAX_IMAGE_DIMENSION + 1, 10)
    expect(r.ok === false && r.code).toBe('dimensionTooLarge')
  })

  it('總像素超過上限要擋', () => {
    const side = Math.floor(Math.sqrt(MAX_IMAGE_PIXELS)) + 100
    const r = checkImageDimensions(side, side)
    expect(r.ok === false && r.code).toBe('tooManyPixels')
    expect(side).toBeLessThanOrEqual(MAX_IMAGE_DIMENSION)
  })

  it('負數與非整數一律當零尺寸', () => {
    expect(checkImageDimensions(-1, 10).ok).toBe(false)
    expect(checkImageDimensions(Number.NaN, 10).ok).toBe(false)
  })
})

describe('一次只收一張圖', () => {
  it('單檔回該檔', () => {
    const f = { type: 'image/png', size: 10 }
    expect(pickSingleImage([f])).toEqual({ ok: true, file: f })
  })

  it('多檔明確拒絕，不默默取第一張', () => {
    const r = pickSingleImage([{ type: 'image/png', size: 10 }, { type: 'image/png', size: 20 }])
    expect(r.ok === false && r.code).toBe('multipleFiles')
  })

  it('沒有檔案回 noFile', () => {
    const r = pickSingleImage([])
    expect(r.ok === false && r.code).toBe('noFile')
  })
})
