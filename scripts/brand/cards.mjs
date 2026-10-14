// 分享圖（1200×630）的文字正本。版面在 render.mjs，站名不寫在這裡：render.mjs 從 src/config/site.ts 讀 siteName（英文卡讀 siteNameEn）。
// 分享圖的 alt 寫在頁面的 useSeoHead（站台預設圖用 site.ts 的 ogImage.alt，/scan/、/barcode/、/batch/、教學總覽與英文三頁在各自的頁面，
// 七個類型頁在 src/config/qr-types.ts 的 ogAlt，教學在 src/content/guide-og.ts），
// 改了圖上的字記得一起看 alt 還對不對。seo:audit 會拿這份對帳：根目錄的 og:image 要是這裡的某個 out，alt 要寫著大標（lines），
// 專屬分享圖（站台預設圖以外）的大標要在 title 裡、alt 以大標開頭並有 banner；每一張的 alt 都要寫著每個小標籤（chips）、
// 圖角標籤（tag）與圖裡的字（標籤紙每格的字、試算表的欄名與財產編號、條碼底下的數字）。每一張都要有頁面用到，教學每篇都要用自己那張。
// 所以頁面的 title 改了說法，這裡跟著改再重跑 render.mjs。小標籤與橫幅不寫數量（例如「幾種類型」），以後加東西才不會過時。
// 換了已經分享出去的圖要給新檔名（out 與頁面的 ogImage.path 一起改，舊檔留在 public/），理由見 docs/brand/README.md「已經分享出去的連結」。
export const CARDS = [
  // 站台預設圖（fallback）：首頁、關於、隱私權、常見問題用它（site.ts 的 ogImage；404 頁不輸出 og 標籤），只有它不必以大標開頭、大標也不必在 title 裡。
  // 1.9.5 把小標籤的「7 種類型」換成不帶數字的說法，首頁的連結分享過很多次，所以換新檔名 -2（舊的 og-default.png 留在 public/）。
  {
    out: 'og-default-2.png',
    fallback: true,
    art: 'logo',
    lines: [{ text: '免費 QR Code', color: 'sun' }, { text: '產生器', color: 'pink' }],
    banner: '線上製作・不上傳・可加 LOGO',
    chips: ['網址、WiFi、名片', '下載 PNG／SVG', '永久有效'],
  },
  {
    out: 'og-scan.png',
    art: 'scan',
    tag: { text: '截圖', color: 'sky' },
    lines: [{ text: 'QR Code', color: 'sun' }, { text: '掃描器', color: 'pink' }],
    banner: '上傳圖片或截圖就能讀取',
    chips: ['圖片不上傳', 'QR Code', '條碼'],
  },
  {
    out: 'og-barcode.png',
    art: 'barcode',
    tag: { text: 'EAN-13', color: 'sun', side: 'right' },
    lines: [{ text: '條碼', color: 'sun' }, { text: '產生器', color: 'pink' }],
    banner: 'EAN-13、Code 128 線上製作',
    chips: ['自動算檢查碼', '下載 SVG', '免費'],
  },
  // 繁中批次頁、七個類型頁與教學總覽（#22）：page 是這張卡用在哪一頁（站內路徑、帶尾斜線），seo:audit 驗那一頁的 og:image 是它。
  // 替代文字以大標開頭，接著橫幅那句、每個小標籤，最後一句講右邊的圖，寫著圖角標籤（tag）的字；批次頁再寫出每格標籤上的字（labels）。
  // 圖裡的 QR Code 一律是該頁自己的網址（render.mjs 用 page 接上 site.ts 的 url），掃了就打開那一頁，不放任何範例帳號或聯絡資料。
  // icon 是 QR Code 中間的 Lucide 圖示，跟 qr-types.ts 那個類型在產生器分頁上的圖示同一個（qr-types.test.ts 驗）。
  {
    out: 'og-batch.png',
    page: '/batch/',
    art: 'labels',
    tag: { text: '標籤紙', color: 'sun', side: 'right' },
    // 每格的 Code 128 與底下那行字：跟批次頁的連號一樣依序編（四位數補零），條碼的內容就是那行字
    labels: ['0001', '0002', '0003', '0004', '0005', '0006'],
    // 第二行最長，跟 Excel 教學那張一樣縮小字級、往下移一點
    titleSize: 76,
    titleTop: 188,
    lines: [{ text: '批次產生', color: 'sun' }, { text: 'QR Code 與條碼', color: 'pink' }],
    banner: 'Excel 貼上，下載 ZIP、印標籤紙',
    chips: ['連號', '自動補檢查碼', '清單不上傳'],
  },
  {
    out: 'og-url.png',
    page: '/url/',
    art: 'qr',
    icon: 'link',
    tag: { text: '網址', color: 'sun', side: 'right' },
    lines: [{ text: '網址轉', color: 'sun' }, { text: 'QR Code', color: 'pink' }],
    banner: '貼上網址，手機一掃就開',
    chips: ['下載 PNG／SVG', '可加 LOGO', '永久有效'],
  },
  {
    out: 'og-wifi.png',
    page: '/wifi/',
    art: 'qr',
    icon: 'wifi',
    tag: { text: 'WiFi', color: 'sky' },
    lines: [{ text: 'WiFi', color: 'sun' }, { text: 'QR Code', color: 'pink' }],
    banner: '掃碼免輸密碼，自動連線',
    chips: ['WPA/WPA2', 'iPhone、Android', '密碼不上傳'],
  },
  {
    out: 'og-vcard.png',
    page: '/vcard/',
    art: 'qr',
    icon: 'contact',
    tag: { text: '電子名片', color: 'mint', side: 'right' },
    lines: [{ text: '電子名片', color: 'sun' }, { text: 'QR Code', color: 'pink' }],
    banner: 'vCard 一掃存入通訊錄',
    chips: ['一鍵加入聯絡人', '可加 LOGO', '資料不上傳'],
  },
  {
    out: 'og-text.png',
    page: '/text/',
    art: 'qr',
    icon: 'type',
    tag: { text: '文字', color: 'pink' },
    lines: [{ text: '文字', color: 'sun' }, { text: 'QR Code', color: 'pink' }],
    banner: '任意文字，掃描直接顯示',
    chips: ['產品序號', '闖關暗號', '文字不上傳'],
  },
  {
    out: 'og-email.png',
    page: '/email/',
    art: 'qr',
    icon: 'mail',
    tag: { text: 'Email', color: 'sun', side: 'right' },
    lines: [{ text: 'Email', color: 'sun' }, { text: 'QR Code', color: 'pink' }],
    banner: '掃碼直接寄信，帶好主旨內文',
    chips: ['客服報修', '活動報名', '不會自動寄出'],
  },
  {
    out: 'og-phone.png',
    page: '/phone/',
    art: 'qr',
    icon: 'phone',
    tag: { text: '電話', color: 'mint' },
    lines: [{ text: '電話', color: 'sun' }, { text: 'QR Code', color: 'pink' }],
    banner: '掃碼一鍵撥號，號碼帶好',
    chips: ['店家招牌', '客服專線', '不會自動撥出'],
  },
  {
    out: 'og-sms.png',
    page: '/sms/',
    art: 'qr',
    icon: 'message-square',
    tag: { text: '簡訊', color: 'sky', side: 'right' },
    lines: [{ text: '簡訊', color: 'sun' }, { text: 'QR Code', color: 'pink' }],
    banner: '掃碼帶入號碼與內容',
    chips: ['活動報名', '抽獎投票', '不會自動送出'],
  },
  {
    out: 'og-guide.png',
    page: '/guide/',
    art: 'qr',
    icon: 'book-open',
    tag: { text: '教學', color: 'sun' },
    lines: [{ text: 'QR Code', color: 'sun' }, { text: '教學總覽', color: 'pink' }],
    banner: '從原理到印刷，一次看懂',
    chips: ['原理與掃描', '容錯與 LOGO', '印刷與 Excel'],
  },
  // 英文版（/en/ 三頁）：站名用 site.ts 的 siteNameEn，標題全是英文字，用 Fredoka、字級小一點才放得下。
  // 替代文字只用 ASCII（引號也不用：meta 的 content 用引號包著），圖角標籤直接寫字、不加「」
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
    tag: { text: 'EAN-13', color: 'sun', side: 'right' },
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
