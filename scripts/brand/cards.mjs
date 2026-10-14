// 分享圖（1200×630）的文字正本。版面在 render.mjs，站名不寫在這裡：render.mjs 從 src/config/site.ts 讀 siteName（英文卡讀 siteNameEn）。
// 分享圖的 alt 寫在頁面的 useSeoHead（首頁用 site.ts 的 ogImage.alt，/scan/ 與 /barcode/ 在各自的頁面，教學在 src/content/guide-og.ts），
// 改了圖上的字記得一起看 alt 還對不對。seo:audit 會拿這份對帳：根目錄的 og:image 要是這裡的某個 out，alt 要寫著大標（lines），
// 專屬分享圖（og-default 以外）的大標要在 title 裡、alt 以大標開頭並有 banner；每一張都要有頁面用到，教學每篇都要用自己那張。
// 所以頁面的 title 改了說法，這裡跟著改再重跑 render.mjs。
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
  // 教學（/guide/<slug>/）每篇一張，檔名固定 og-guide-<slug>.png，guide 對到 src/content/guides.ts 的 slug。
  // 大標要是文章 title 的一段（seo:audit 驗），替代文字在 src/content/guide-og.ts，以大標開頭、寫著橫幅那句、每個小標籤（chips）
  // 與圖角標籤（tag）的字，Excel 那張再加試算表上的字（sheet）；guide-og.test.ts 逐字對帳。
  // qr 是圖裡 QR Code 的內容（站內路徑，render.mjs 接上 site.ts 的 url），掃了就到這篇；ec 是它的容錯等級。
  // figure、ec 兩種圖直接用文章裡的示意圖（public/guides/，gen-guide-figures.mjs 產生），qr 寫的是那張圖本來編的內容，只拿來驗。
  // render.mjs 產圖後會用站上的解碼器讀一次，每個碼都要以對的碼制（QR Code、Code 128、EAN-13）讀出對的內容，不然就停。
  {
    out: 'og-guide-what-is-qr-code.png',
    guide: 'what-is-qr-code',
    art: 'figure',
    figure: 'guides/anatomy.svg',
    qr: '/',
    tag: { text: '構造', color: 'sky' },
    lines: [{ text: '什麼是', color: 'sun' }, { text: 'QR Code？', color: 'pink' }],
    banner: '原理、版本容量與安全性',
    chips: ['構造圖', '容量查表', '掃描安全'],
  },
  {
    out: 'og-guide-error-correction.png',
    guide: 'error-correction',
    art: 'ec',
    qr: '/guide/error-correction/',
    lines: [{ text: '容錯等級', color: 'sun' }, { text: '怎麼選？', color: 'pink' }],
    banner: 'L/M/Q/H 一次搞懂',
    chips: ['疏密對照', '情境建議', '加 LOGO 怎麼調'],
  },
  {
    out: 'og-guide-qr-with-logo.png',
    guide: 'qr-with-logo',
    art: 'qr',
    qr: '/guide/qr-with-logo/',
    logo: true,
    tag: { text: 'LOGO', color: 'sun', side: 'right' },
    titleSize: 84,
    lines: [{ text: '加入 LOGO', color: 'sun' }, { text: '又能正常掃描？', color: 'pink' }],
    banner: 'QR Code 加 LOGO 的大小與配色',
    chips: ['圖檔準備', '透明背景', '印刷檢查'],
  },
  {
    out: 'og-guide-scan-qr-code.png',
    guide: 'scan-qr-code',
    art: 'scan',
    qr: '/guide/scan-qr-code/',
    ec: 'H',
    tag: { text: '手機', color: 'sky' },
    lines: [{ text: '如何掃描', color: 'sun' }, { text: 'QR Code？', color: 'pink' }],
    banner: '手機相機、LINE、電腦都能掃',
    chips: ['iPhone', 'Android', '掃不到怎麼辦'],
  },
  {
    out: 'og-guide-line-qr-code.png',
    guide: 'line-qr-code',
    art: 'qr',
    qr: '/guide/line-qr-code/',
    tag: { text: 'LINE', color: 'sky' },
    titleSize: 88,
    lines: [{ text: 'LINE QR Code', color: 'sun' }, { text: '怎麼做？', color: 'pink' }],
    banner: '製作與分享行動條碼',
    chips: ['個人帳號', '官方帳號', '可加 LOGO'],
  },
  {
    out: 'og-guide-qr-code-svg.png',
    guide: 'qr-code-svg',
    art: 'figure',
    figure: 'guides/quiet-zone.svg',
    qr: '/',
    tag: { text: 'SVG', color: 'sun', side: 'right' },
    titleSize: 92,
    lines: [{ text: 'QR Code 下載', color: 'sun' }, { text: 'SVG 向量檔', color: 'pink' }],
    banner: '印刷不失真完整教學',
    chips: ['尺寸換算', '四周留白', '送印檢查'],
  },
  {
    out: 'og-guide-excel-qr-code-barcode.png',
    guide: 'excel-qr-code-barcode',
    art: 'sheet',
    tag: { text: 'Excel', color: 'sun', side: 'right' },
    // 右邊試算表上的字：跟文章同一份合成財產清冊的欄名與前三列，每列的 QR Code 與 Code 128 內容就是財產編號
    sheet: { head: ['財產編號', 'QR Code', '條碼'], rows: ['A-0001', 'A-0002', 'A-0003'] },
    // 第二行最長，字級要小才放得下；兩行變矮了，往下移一點讓大標在橫幅上方的空間裡置中
    titleSize: 74,
    titleTop: 188,
    lines: [{ text: 'Excel 怎麼做', color: 'sun' }, { text: 'QR Code 與條碼？', color: 'pink' }],
    banner: '從公式到合併列印',
    chips: ['IMAGE 函數', '條碼字型', 'Word 合併列印'],
  },
]

// 圖裡的條碼是真的，掃得出來（內容刻意用站內示例值，跟 test/fixtures/scan 的黃金測試圖一致）
export const SCAN_QR_TEXT = 'https://www.pocketool.app/qrcode-studio/'
export const BARCODE_EAN13 = '4710088331236'
