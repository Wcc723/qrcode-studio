// 分享圖（1200×630）的文字正本。版面在 render.mjs，站名不寫在這裡：render.mjs 從 src/config/site.ts 讀 siteName（英文卡讀 siteNameEn）。
// 分享圖的 alt 寫在頁面的 useSeoHead（首頁用 site.ts 的 ogImage.alt，/scan/ 與 /barcode/ 在各自的頁面），
// 改了圖上的字記得一起看 alt 還對不對。seo:audit 會拿這份對帳：根目錄的 og:image 要是這裡的某個 out，alt 要寫著大標（lines），
// /scan/ 與 /barcode/ 的大標要在 title 裡、alt 要有 banner；所以頁面的 title 改了說法，這裡跟著改再重跑 render.mjs。
export const CARDS = [
  {
    out: 'og-default.png',
    art: 'logo',
    lines: [{ text: '免費 QR Code', color: 'sun' }, { text: '產生器', color: 'pink' }],
    banner: '線上製作・不上傳・可加 LOGO',
    chips: ['7 種類型', '下載 PNG／SVG', '永久有效'],
  },
  {
    out: 'og-scan.png',
    art: 'scan',
    lines: [{ text: 'QR Code', color: 'sun' }, { text: '掃描器', color: 'pink' }],
    banner: '上傳圖片或截圖就能讀取',
    chips: ['圖片不上傳', 'QR Code', '條碼'],
  },
  {
    out: 'og-barcode.png',
    art: 'barcode',
    lines: [{ text: '條碼', color: 'sun' }, { text: '產生器', color: 'pink' }],
    banner: 'EAN-13、Code 128 線上製作',
    chips: ['自動算檢查碼', '下載 SVG', '免費'],
  },
  // 英文版（/en/ 三頁）：站名用 site.ts 的 siteNameEn，標題全是英文字，用 Fredoka、字級小一點才放得下
  {
    out: 'og-en.png',
    lang: 'en',
    art: 'logo',
    titleSize: 92,
    lines: [{ text: 'Free QR Code', color: 'sun' }, { text: 'Generator', color: 'pink' }],
    banner: 'Online, no sign-up, add a logo',
    chips: ['PNG and SVG', 'No watermark', 'Never expires'],
  },
  {
    out: 'og-en-batch.png',
    lang: 'en',
    art: 'logo',
    titleSize: 92,
    lines: [{ text: 'Bulk QR Code', color: 'sun' }, { text: 'Generator', color: 'pink' }],
    banner: 'Barcodes and labels from Excel or CSV',
    chips: ['ZIP of PNG or SVG', 'Letter labels', 'No upload'],
  },
  {
    out: 'og-en-barcode.png',
    lang: 'en',
    art: 'barcode',
    titleSize: 96,
    lines: [{ text: 'Barcode', color: 'sun' }, { text: 'Generator', color: 'pink' }],
    banner: 'Code 128, EAN-13, ITF-14 online',
    chips: ['Check digit included', 'True-size SVG', 'Free'],
  },
]

// 圖裡的條碼是真的，掃得出來（內容刻意用站內示例值，跟 test/fixtures/scan 的黃金測試圖一致）
export const SCAN_QR_TEXT = 'https://www.pocketool.app/qrcode-studio/'
export const BARCODE_EAN13 = '4710088331236'
