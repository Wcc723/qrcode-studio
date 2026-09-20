/**
 * 測試用的最小 PNG 解碼器：把 fixture PNG 還原成 ImageData 形狀的 RGBA 像素。
 *
 * production 在瀏覽器裡是靠 `createImageBitmap` ＋ canvas 取得 ImageData，Node 沒有
 * 那兩個 API，所以黃金測試需要自己把圖解回像素，才能真的走到 production 的
 * `decodeImageData()`（而不是改走「把檔案 bytes 丟給 WASM」那條 production 沒用的路）。
 *
 * 只處理 8-bit、非隔行的 PNG：fixture 由 scripts/fixtures/gen-scan-fixtures.mjs
 * 統一輸出成這種編碼，不必為了讀自家 fixture 寫一個完整的 PNG 實作。
 */
import { inflateSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// data 明寫成 ArrayBuffer-backed：lib.dom 的 ImageData.data 不接受可能是
// SharedArrayBuffer 的泛型版本，而我們配置出來的本來就是一般 ArrayBuffer。
export interface RgbaImage {
  data: Uint8ClampedArray<ArrayBuffer>
  width: number
  height: number
  colorSpace: 'srgb'
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 }

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

export function decodePng(bytes: Uint8Array): RgbaImage {
  if (!PNG_SIG.every((b, i) => bytes[i] === b)) throw new Error('不是 PNG')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  let offset = 8
  let width = 0, height = 0, colorType = 0
  const idat: Uint8Array[] = []
  while (offset < bytes.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8))
    const body = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8)
      height = view.getUint32(offset + 12)
      const bitDepth = bytes[offset + 16]
      colorType = bytes[offset + 17]
      if (bitDepth !== 8) throw new Error(`只支援 8-bit PNG，收到 ${bitDepth}`)
      if (bytes[offset + 20] !== 0) throw new Error('不支援隔行 PNG')
      if (!(colorType in CHANNELS)) throw new Error(`不支援的 colorType ${colorType}`)
    } else if (type === 'IDAT') {
      idat.push(body)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }

  const raw = new Uint8Array(inflateSync(Buffer.concat(idat.map(c => Buffer.from(c)))))
  const channels = CHANNELS[colorType]
  const stride = width * channels
  const pixels = new Uint8Array(height * stride)

  // 逐列反濾波（PNG filter type 0–4）
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const out = pixels.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[i - channels] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= channels ? prev[i - channels] : 0
      const x = line[i]
      out[i] = (
        filter === 0 ? x
          : filter === 1 ? x + a
            : filter === 2 ? x + b
              : filter === 3 ? x + ((a + b) >> 1)
                : x + paeth(a, b, c)
      ) & 0xff
    }
  }

  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const src = i * channels
    if (colorType === 0 || colorType === 4) {
      const v = pixels[src]
      data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v
      data[i * 4 + 3] = colorType === 4 ? pixels[src + 1] : 255
    } else {
      data[i * 4] = pixels[src]
      data[i * 4 + 1] = pixels[src + 1]
      data[i * 4 + 2] = pixels[src + 2]
      data[i * 4 + 3] = colorType === 6 ? pixels[src + 3] : 255
    }
  }

  return { data, width, height, colorSpace: 'srgb' }
}

export function fixturePath(name: string): string {
  // fileURLToPath：repo 路徑含非 ASCII 字元時 URL.pathname 會是百分號編碼，fs 讀不到。
  return fileURLToPath(new URL(`../fixtures/scan/${name}`, import.meta.url))
}

export function readFixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(fixturePath(name)))
}

export function readFixtureImage(name: string): RgbaImage {
  return decodePng(readFixture(name))
}
