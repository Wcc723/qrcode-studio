// 分享圖（1200×630）的文字正本。版面在 render.mjs，站名不寫在這裡：render.mjs 從 src/config/site.ts 讀 siteName。
// 分享圖的 alt 寫在頁面的 useSeoHead（首頁用 site.ts 的 ogImage.alt，/scan/ 與 /barcode/ 在各自的頁面），
// 改了圖上的字記得一起看 alt 還對不對。
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
    banner: '上傳圖片或貼上截圖就能解碼',
    chips: ['圖片不上傳', 'QR Code', '一維條碼'],
  },
  {
    out: 'og-barcode.png',
    art: 'barcode',
    lines: [{ text: '一維條碼', color: 'sun' }, { text: '產生器', color: 'pink' }],
    banner: 'EAN-13、Code 128 線上製作',
    chips: ['自動算檢查碼', '下載 SVG', '免費'],
  },
]

// 圖裡的條碼是真的，掃得出來（內容刻意用站內示例值，跟 test/fixtures/scan 的黃金測試圖一致）
export const SCAN_QR_TEXT = 'https://www.pocketool.app/qrcode-studio/'
export const BARCODE_EAN13 = '4710088331236'
