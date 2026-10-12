/**
 * PNG 的畫法：先算出「要填哪些黑色矩形、文字放哪裡」（RasterPlan），再交給 canvas 照著填。
 *
 * 直接畫矩形而不是把 SVG 轉圖：drawImage 縮放會在條與方塊的硬邊緣產生抗鋸齒灰邊，
 * 那正是掃描器判斷邊界時最怕的東西。計畫是純資料，測試可以把同一份計畫填進一塊像素陣列，
 * 再交給解碼器讀回來，驗的就是瀏覽器裡實際畫出來的樣子。
 */
import { barcodeGeometry, type BarcodePattern } from './encodeBarcode'

export interface RasterRect { x: number; y: number; w: number; h: number }

export interface RasterPlan {
  /** 畫布寬高（像素） */
  width: number
  height: number
  /** 黑色矩形，底色一律白色 */
  rects: RasterRect[]
  /** 人眼可讀的號碼（一維條碼才有） */
  text: { s: string; x: number; y: number; size: number } | null
}

/** canvas 2D context 用得到的那幾個成員；測試用假的 context 實作同一組 */
export interface PlanCanvas {
  fillStyle: unknown
  font: string
  textAlign: CanvasTextAlign
  imageSmoothingEnabled: boolean
  fillRect(x: number, y: number, w: number, h: number): void
  fillText(text: string, x: number, y: number): void
}

/** 照計畫畫：白底、黑色矩形、文字。畫布的寬高由呼叫端先設成 plan.width × plan.height。 */
export function paintPlan(ctx: PlanCanvas, plan: RasterPlan): void {
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, plan.width, plan.height)
  ctx.fillStyle = '#000000'
  for (const r of plan.rects) ctx.fillRect(r.x, r.y, r.w, r.h)
  if (plan.text) {
    ctx.font = `${plan.text.size}px monospace`
    ctx.textAlign = 'center'
    ctx.fillText(plan.text.s, plan.text.x, plan.text.y)
  }
}

/**
 * 一維條碼的 PNG：最細的線佔 `scale` 像素（條碼產生器的「PNG 清晰度」），條高 40 倍、字 8 倍。
 * 靜區沿用 encodeBarcode 的規範值，畫在白底裡。
 */
export function barcodeRasterPlan(pattern: BarcodePattern, scale: number): RasterPlan {
  const g = barcodeGeometry(pattern, { moduleWidth: scale, height: scale * 40, fontSize: scale * 8 })
  return { width: g.width, height: g.height, rects: [...g.bearer, ...g.bars], text: g.text }
}
