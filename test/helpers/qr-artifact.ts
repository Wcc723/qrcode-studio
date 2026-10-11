/**
 * 下載檔的產物 oracle：照 production 的路徑做出 SVG／PNG／JPG，再從像素量回幾何。
 *
 * 產物怎麼來
 * ----------
 * - SVG：真的 qr-code-styling（happy-dom 裡跑），吃 production 的 `mapToQrOptions`，`getRawData('svg')` 原樣拿出來。
 * - PNG：瀏覽器裡 qr-code-styling 的 canvas 就是把同一份 SVG 畫上去；這裡改用 sharp（librsvg）把那份 SVG
 *   光柵化成同樣寬高的 PNG。
 * - JPG：production 是同一張 canvas 轉 JPEG（品質 0.92），透明背景時先疊白底（`flattenToJpeg`）。
 *   這裡同樣疊白底、品質 92。
 *
 * 量測刻意不讀我們自己算的 margin，只看像素：
 * 深色像素的外框就是碼的邊界（三個定位圖案頂到上、左、右、下四邊），
 * 左上定位圖案最上面那一列是 7 個連續的深色模組，用它的長度除以 7 得到模組大小，
 * 四邊的留白再除以模組大小，就是以模組為單位的靜區。
 */
import QRCodeStyling, { type Options } from 'qr-code-styling'
import sharp from 'sharp'

export type ArtifactFormat = 'png' | 'svg' | 'jpg'

export interface Pixels {
  data: Uint8ClampedArray<ArrayBuffer>
  width: number
  height: number
  colorSpace: 'srgb'
}

export interface Artifact {
  format: ArtifactFormat
  /** 檔案本身（SVG 是 UTF-8 文字的位元組） */
  bytes: Uint8Array
  /** 檔案宣告的外部寬高 */
  width: number
  height: number
  /** 光柵化後的像素，透明的地方保留透明 */
  pixels: Pixels
}

/**
 * happy-dom 的 `<img>` 不會真的載入圖片（onload 永遠不來），qr-code-styling 等 LOGO 會等到天荒地老。
 * 套件在 Node 有另一條路：給 `nodeCanvas.loadImage`。這裡只回報 LOGO 的實際寬高、把原本的 data URL
 * 原樣交回去；瀏覽器那條路最後也是把同一個 data URL 嵌進 SVG 的 `<image>`，產物一樣。
 */
async function logoLoader(): Promise<Options['nodeCanvas']> {
  const loadImage = async (src: string) => {
    const base64 = src.slice(src.indexOf(',') + 1)
    const meta = await sharp(Buffer.from(base64, 'base64')).metadata()
    return { width: meta.width, height: meta.height, src }
  }
  const createCanvas = () => {
    let drawn: { src: string } | null = null
    return {
      getContext: () => ({ drawImage: (img: { src: string }) => { drawn = img } }),
      toDataURL: () => drawn?.src ?? '',
    }
  }
  return { loadImage, createCanvas } as unknown as Options['nodeCanvas']
}

/** 用真的 qr-code-styling 產生 SVG 字串（production 的 SVG 下載就是這份）。 */
export async function renderSvg(opts: Options): Promise<string> {
  const qr = new QRCodeStyling({ ...opts, type: 'svg', ...(opts.image ? { nodeCanvas: await logoLoader() } : {}) })
  const raw = await qr.getRawData('svg')
  if (!raw) throw new Error('qr-code-styling 沒有畫出 SVG')
  return raw instanceof Blob ? await raw.text() : String(raw)
}

async function rawPixels(input: Buffer): Promise<Pixels> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = new Uint8ClampedArray(new ArrayBuffer(data.length))
  out.set(data)
  return { data: out, width: info.width, height: info.height, colorSpace: 'srgb' }
}

function svgSize(svg: string): { width: number; height: number } {
  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? ''
  const attr = (name: string) => Number(root.match(new RegExp(`\\s${name}="([\\d.]+)"`))?.[1])
  return { width: attr('width'), height: attr('height') }
}

/** 照 production 的三種下載格式做出產物。 */
export async function makeArtifact(opts: Options, format: ArtifactFormat): Promise<Artifact> {
  const svg = await renderSvg(opts)
  const svgBuf = Buffer.from(svg, 'utf8')
  if (format === 'svg') {
    const { width, height } = svgSize(svg)
    return { format, bytes: new Uint8Array(svgBuf), width, height, pixels: await rawPixels(await sharp(svgBuf).png().toBuffer()) }
  }
  const out = format === 'png'
    ? await sharp(svgBuf).png().toBuffer()
    : await sharp(svgBuf).flatten({ background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer()
  const meta = await sharp(out).metadata()
  return { format, bytes: new Uint8Array(out), width: meta.width!, height: meta.height!, pixels: await rawPixels(out) }
}

/** 透明的地方疊到白底上：透明碼只保證放在淺色素面上掃得到，解碼也照這個條件。 */
export function onWhite(p: Pixels): Pixels {
  const data = new Uint8ClampedArray(new ArrayBuffer(p.data.length))
  for (let i = 0; i < p.data.length; i += 4) {
    const a = p.data[i + 3] / 255
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(p.data[i + c] * a + 255 * (1 - a))
    data[i + 3] = 255
  }
  return { ...p, data }
}

function isDark(p: Pixels, x: number, y: number): boolean {
  const i = (y * p.width + x) * 4
  const a = p.data[i + 3]
  if (a < 128) return false
  const lum = 0.299 * p.data[i] + 0.587 * p.data[i + 1] + 0.114 * p.data[i + 2]
  return lum < 128
}

export interface MeasuredGeometry {
  /** 一個模組幾像素（由左上定位圖案量出） */
  moduleSize: number
  /** 每邊幾個模組（碼的外框寬 ÷ 模組大小，四捨五入） */
  moduleCount: number
  /** 四邊留白，單位是模組 */
  quiet: { top: number; right: number; bottom: number; left: number }
  /** 四邊裡最窄的那一邊 */
  minQuiet: number
}

/** 從像素量出模組大小與四邊靜區。找不到碼就丟例外（fail closed）。 */
export function measureQuietZone(p: Pixels): MeasuredGeometry {
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      if (!isDark(p, x, y)) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) throw new Error('圖裡沒有任何深色像素')

  // 左上定位圖案的上緣：7 個連續的深色模組。第一列與第二列像素各量一次取長的那個：
  // 模組只有 1 px 時第二列已經進到定位圖案裡的淺色圈；JPEG 的雜點只會把連續的深色截短，不會拉長。
  const runAt = (row: number) => {
    let run = 0
    while (minX + run <= maxX && isDark(p, minX + run, row)) run++
    return run
  }
  const moduleSize = Math.max(runAt(minY), runAt(Math.min(minY + 1, maxY))) / 7
  if (!(moduleSize > 0)) throw new Error('量不到定位圖案')

  const quiet = {
    top: minY / moduleSize,
    right: (p.width - 1 - maxX) / moduleSize,
    bottom: (p.height - 1 - maxY) / moduleSize,
    left: minX / moduleSize,
  }
  return {
    moduleSize,
    moduleCount: Math.round((maxX - minX + 1) / moduleSize),
    quiet,
    minQuiet: Math.min(quiet.top, quiet.right, quiet.bottom, quiet.left),
  }
}
