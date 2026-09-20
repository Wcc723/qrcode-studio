import { describe, it, expect, vi } from 'vitest'
import { blobToImageData, type BitmapEnv, type BitmapSource } from './image-to-imagedata'
import { ImageInputError, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS } from '@/pure/imageInput'

function fakeBitmap(width: number, height: number) {
  const state = { closed: 0 }
  const bitmap: BitmapSource = { width, height, close: () => { state.closed++ } }
  return { bitmap, state }
}

function makeEnv(width = 120, height = 90, over: Partial<BitmapEnv> = {}) {
  const { bitmap, state } = fakeBitmap(width, height)
  const env: BitmapEnv = {
    decode: vi.fn(async () => bitmap),
    toImageData: vi.fn((_b, w, h) => ({
      data: new Uint8ClampedArray(w * h * 4), width: w, height: h, colorSpace: 'srgb',
    }) as ImageData),
    ...over,
  }
  return { env, state }
}

const blob = new Blob([new Uint8Array(8)], { type: 'image/png' })

describe('把圖片解成像素', () => {
  it('回傳與點陣圖同尺寸的 ImageData', async () => {
    const { env } = makeEnv(120, 90)
    const loaded = await blobToImageData(blob, env)
    expect(loaded.imageData.width).toBe(120)
    expect(loaded.imageData.height).toBe(90)
  })

  it('close() 會釋放底層點陣圖，重複呼叫只釋放一次', async () => {
    const { env, state } = makeEnv()
    const loaded = await blobToImageData(blob, env)
    loaded.close()
    loaded.close()
    expect(state.closed).toBe(1)
  })
})

describe('像素上限要在配置 canvas 之前擋下來', () => {
  it('單邊超限時不會去取像素，而且點陣圖當場釋放', async () => {
    const { env, state } = makeEnv(MAX_IMAGE_DIMENSION + 1, 10)
    await expect(blobToImageData(blob, env)).rejects.toBeInstanceOf(ImageInputError)
    expect(env.toImageData).not.toHaveBeenCalled()
    expect(state.closed).toBe(1)
  })

  it('總像素超限時同樣在取像素之前擋下', async () => {
    const side = Math.floor(Math.sqrt(MAX_IMAGE_PIXELS)) + 100
    const { env, state } = makeEnv(side, side)
    await expect(blobToImageData(blob, env)).rejects.toBeInstanceOf(ImageInputError)
    expect(env.toImageData).not.toHaveBeenCalled()
    expect(state.closed).toBe(1)
  })

  it('零尺寸（常見的損毀徵兆）也擋', async () => {
    const { env } = makeEnv(0, 0)
    await expect(blobToImageData(blob, env)).rejects.toBeInstanceOf(ImageInputError)
  })

  it('丟出的錯誤帶得出可讀訊息與原因碼', async () => {
    const { env } = makeEnv(MAX_IMAGE_DIMENSION + 1, 10)
    await expect(blobToImageData(blob, env)).rejects.toMatchObject({ code: 'dimensionTooLarge' })
    await blobToImageData(blob, env).catch((e: ImageInputError) => {
      expect(e.message).toContain(String(MAX_IMAGE_DIMENSION))
    })
  })
})

describe('取像素失敗', () => {
  it('canvas 取不到像素時仍要釋放點陣圖，不能漏', async () => {
    const { env, state } = makeEnv(100, 100, {
      toImageData: vi.fn(() => { throw new Error('canvas 沒有 2d context') }),
    })
    await expect(blobToImageData(blob, env)).rejects.toThrow()
    expect(state.closed).toBe(1)
  })
})
