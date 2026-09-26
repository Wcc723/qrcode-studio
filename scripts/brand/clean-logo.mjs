#!/usr/bin/env node
// 把 Codex 生成、色鍵去背過的站徽原圖整理成 512×512 的透明正本。
//
//   node scripts/brand/clean-logo.mjs <codex 原圖.png> <輸出.png>
//
// Codex 的圖是畫在洋紅 #FF00FF 底上、再用它自己的 remove_chroma_key.py 轉成透明，會留下兩種殘渣：
//   1. 整片背景還有 alpha 10 到 25 的洋紅雜點（肉眼看不到，但縮圖時會把邊緣染成粉紅）
//   2. 主體邊緣那一圈半透明像素帶著洋紅色偏（深色分頁列上看得到一圈粉紅邊）
// 這支的做法：只保留主體附近 4px 以內的像素，其餘 alpha 歸零；邊緣半透明像素的顏色改用往外推的主體顏色
// （alpha 不動，反鋸齒保留），最後裁掉空白、置中縮成 512×512，主體最長邊佔 92%。
// 只有重新生圖時才要跑；正本 scripts/brand/logo-source.png 已經 commit。
import sharp from 'sharp'

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error('用法：node scripts/brand/clean-logo.mjs <codex 原圖.png> <輸出.png>')
  process.exit(1)
}

const SIZE = 512
const FILL = 0.92
const BAND = 4 // 主體外保留的像素寬度
const SOLID = 128 // alpha 至少這麼多才算主體

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H } = info
const px = (x, y) => (y * W + x) * 4

// 主體遮罩，往外擴 BAND 像素
let near = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) near[i] = data[i * 4 + 3] >= SOLID ? 1 : 0
for (let step = 0; step < BAND; step++) {
  const next = near.slice()
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (near[y * W + x]) continue
      if ((x > 0 && near[y * W + x - 1]) || (x < W - 1 && near[y * W + x + 1]) ||
          (y > 0 && near[(y - 1) * W + x]) || (y < H - 1 && near[(y + 1) * W + x])) next[y * W + x] = 1
    }
  }
  near = next
}
for (let i = 0; i < W * H; i++) if (!near[i]) data[i * 4 + 3] = 0

// 邊緣去色偏：完全不透明的像素顏色是乾淨的，一圈一圈往外推給半透明像素
let known = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) known[i] = data[i * 4 + 3] === 255 ? 1 : 0
for (let step = 0; step < BAND + 4; step++) {
  const next = known.slice()
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      if (known[i] || data[i * 4 + 3] === 0) continue
      let r = 0, g = 0, b = 0, n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || !known[ny * W + nx]) continue
          const p = px(nx, ny)
          r += data[p]; g += data[p + 1]; b += data[p + 2]; n++
        }
      }
      if (!n) continue
      const p = i * 4
      data[p] = Math.round(r / n); data[p + 1] = Math.round(g / n); data[p + 2] = Math.round(b / n)
      next[i] = 1
    }
  }
  known = next
}
// 推不到的半透明像素（離主體太遠）直接透明
for (let i = 0; i < W * H; i++) if (!known[i]) data[i * 4 + 3] = 0

// 裁到主體外框，置中放進正方形，主體最長邊佔 FILL
let x0 = W, y0 = H, x1 = -1, y1 = -1
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[px(x, y) + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  }
}
const bw = x1 - x0 + 1, bh = y1 - y0 + 1
const side = Math.round(Math.max(bw, bh) / FILL)
const cleaned = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: x0, top: y0, width: bw, height: bh })
  .extend({
    top: Math.floor((side - bh) / 2), bottom: Math.ceil((side - bh) / 2),
    left: Math.floor((side - bw) / 2), right: Math.ceil((side - bw) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()
await sharp(cleaned).resize(SIZE, SIZE, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(output)
console.log(`[clean-logo] ${input} → ${output}（主體 ${bw}×${bh}，置中放進 ${side}×${side} 再縮成 ${SIZE}）`)
