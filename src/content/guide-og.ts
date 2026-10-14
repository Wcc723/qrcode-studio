import type { OgImage } from '@/config/site'

// 教學各篇自己的分享圖（1200×630），分享到 LINE、Facebook 時看得出是哪一篇。
// 圖由 scripts/brand/render.mjs 照 scripts/brand/cards.mjs 產到 public/og-guide-<slug>.png（產物進版控），
// 圖上的字的正本在 cards.mjs（guide 欄位對到 slug）；這裡只放替代文字（og:image:alt、twitter:image:alt）。
// 替代文字以圖上的大標開頭，接著橫幅那句與小標籤的內容，最後一句講右邊的圖，寫著圖角那個標籤的字（cards.mjs 的 tag），
// Excel 那篇再寫出試算表上的欄名與財產編號，跟圖上的字一致；改了圖上的字，這裡一起改，再重跑 render.mjs。
// guide-og.test.ts 與 seo:audit 都拿 cards.mjs 對帳。只有文章頁（動態載入）用得到，所以不放進會進 entry chunk 的 guides.ts。
// 只換分享圖不算實質改寫：guides.ts 的 updated 與 sitemap 的 lastmod 都不動。
export const guideOgAlt: Record<string, string> = {
  'what-is-qr-code': '什麼是 QR Code？原理、版本容量與安全性，附構造圖、容量查表與掃描安全。右邊是標著「構造」的 QR Code 構造圖',
  'error-correction': '容錯等級怎麼選？L/M/Q/H 一次搞懂，附疏密對照、情境建議與加 LOGO 怎麼調。右邊是 L、M、Q、H 四個等級的 QR Code 對照',
  'qr-with-logo': '加入 LOGO 又能正常掃描？QR Code 加 LOGO 的大小與配色，附圖檔準備、透明背景與印刷檢查。右邊是標著「LOGO」、中間放了站徽的 QR Code',
  'scan-qr-code': '如何掃描 QR Code？手機相機、LINE、電腦都能掃，含 iPhone、Android 與掃不到怎麼辦。右邊是標著「手機」、正在掃描的 QR Code',
  'line-qr-code': 'LINE QR Code 怎麼做？製作與分享行動條碼，個人帳號、官方帳號都適用，可加 LOGO。右邊是標著「LINE」的 QR Code',
  'qr-code-svg': 'QR Code 下載 SVG 向量檔：印刷不失真完整教學，附尺寸換算、四周留白與送印檢查。右邊是標著「SVG」、畫出四周留白的 QR Code 示意圖',
  'excel-qr-code-barcode': 'Excel 怎麼做 QR Code 與條碼？從公式到合併列印，比較 IMAGE 函數、條碼字型與 Word 合併列印。右邊是標著「Excel」的試算表，欄名是財產編號、QR Code、條碼，A-0001、A-0002、A-0003 每列各有一個 QR Code 與條碼',
}

/** 這篇教學的分享圖。檔名固定是 og-guide-<slug>.png，跟 cards.mjs 的 out 一致。 */
export function guideOgImage(slug: string): OgImage {
  const alt = Object.hasOwn(guideOgAlt, slug) ? guideOgAlt[slug] : undefined
  if (!alt) throw new Error(`[guide-og] ${slug} 沒有分享圖的替代文字`)
  return { path: `/og-guide-${slug}.png`, width: 1200, height: 630, alt }
}
