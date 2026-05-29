import type { QrType } from '@/types'

export interface FaqItem { q: string; a: string }
export interface QrTypeMeta {
  type: QrType
  path: string            // 路由路徑，'' 代表首頁
  label: string           // tab 顯示
  routeName: string
  h1: string
  title: string           // <title>
  description: string     // meta description
  intro: string           // landing 頁開頭段落
  steps: string[]         // 使用步驟
  faqs: FaqItem[]
}

export const qrTypes: QrTypeMeta[] = [
  {
    type: 'url', path: '/url', routeName: 'url', label: '網址',
    h1: '網址 QR Code 產生器',
    title: '網址 QR Code 產生器｜免費、不上傳、可加 LOGO',
    description: '把網址轉成 QR Code，瀏覽器內即時生成、不上傳，免費下載 PNG / SVG，可自訂顏色與 LOGO。',
    intro: '輸入任何網址，立即產生可掃描的 QR Code。常用於名片、海報、產品包裝與線上線下導流。',
    steps: ['貼上或輸入網址', '自訂顏色、加入 LOGO（可選）', '下載 PNG 或 SVG'],
    faqs: [
      { q: '產生的 QR Code 會過期嗎？', a: '不會。這是靜態 QR Code，內容直接編碼在圖中，永久有效、不需聯網、不會失效。' },
      { q: '我的網址會被上傳嗎？', a: '不會。整個產生過程都在你的瀏覽器完成，不會傳送到任何伺服器。' },
    ],
  },
  {
    type: 'wifi', path: '/wifi', routeName: 'wifi', label: 'WiFi',
    h1: 'WiFi QR Code 產生器',
    title: 'WiFi QR Code 產生器｜掃碼免輸密碼連線',
    description: '產生 WiFi QR Code，訪客掃碼即可自動連線，免手動輸入密碼。免費、不上傳、可下載 PNG / SVG。',
    intro: '輸入網路名稱與密碼，產生 WiFi QR Code。貼在店面或會議室，客人掃一下就能連上網。',
    steps: ['輸入 SSID 與密碼、選擇加密方式', '自訂外觀（可選）', '下載並張貼'],
    faqs: [
      { q: '支援哪些加密方式？', a: '支援 WPA/WPA2、WEP，以及開放網路（無密碼）。' },
      { q: '密碼安全嗎？', a: '密碼只在你的瀏覽器內編碼成圖片，不會上傳；但任何掃描到該圖的人都能連線，請張貼於受控場所。' },
    ],
  },
  {
    type: 'vcard', path: '/vcard', routeName: 'vcard', label: '電子名片',
    h1: '電子名片 vCard QR Code 產生器',
    title: '電子名片 QR Code 產生器｜vCard 一掃存聯絡人',
    description: '產生 vCard 電子名片 QR Code，掃碼即可把姓名、電話、Email 一鍵存入手機通訊錄。免費、不上傳。',
    intro: '輸入聯絡資訊，產生電子名片 QR Code。對方掃描後可直接把你存進通訊錄，適合放在名片或 Email 簽名檔。',
    steps: ['填寫姓名、電話、Email 等資訊', '自訂外觀（可選）', '下載並印在名片上'],
    faqs: [
      { q: '掃描後能直接存通訊錄嗎？', a: '可以。採用標準 vCard 3.0 格式，iOS 與 Android 相機掃描後皆可一鍵加入聯絡人。' },
      { q: '可以放公司與職稱嗎？', a: '可以，支援公司、職稱、地址、網站等欄位，留空則自動省略。' },
    ],
  },
  {
    type: 'text', path: '/text', routeName: 'text', label: '純文字',
    h1: '純文字 QR Code 產生器',
    title: '文字 QR Code 產生器｜任意文字轉 QR',
    description: '把任意文字轉成 QR Code，瀏覽器內即時生成、不上傳，免費下載 PNG / SVG。',
    intro: '輸入任何文字內容並產生 QR Code，適合留言、序號、說明或活動暗號。',
    steps: ['輸入文字', '自訂外觀（可選）', '下載 PNG 或 SVG'],
    faqs: [
      { q: '可以放多長的文字？', a: 'QR Code 容量有限，文字越長圖越密。過長時建議提高容錯或縮短內容；超出容量會提示。' },
    ],
  },
  {
    type: 'email', path: '/email', routeName: 'email', label: 'Email',
    h1: 'Email QR Code 產生器',
    title: 'Email QR Code 產生器｜掃碼直接寄信',
    description: '產生 Email QR Code，掃碼自動開啟郵件 App 並帶入收件者、主旨與內文。免費、不上傳。',
    intro: '輸入收件者、主旨與內文，產生可直接寄信的 QR Code，方便客服與表單回收。',
    steps: ['輸入收件者、主旨、內文', '自訂外觀（可選）', '下載並使用'],
    faqs: [
      { q: '掃描後會自動寄出嗎？', a: '不會自動寄出，只會開啟郵件 App 並帶入內容，由使用者確認後送出。' },
    ],
  },
  {
    type: 'phone', path: '/phone', routeName: 'phone', label: '電話',
    h1: '電話 QR Code 產生器',
    title: '電話 QR Code 產生器｜掃碼一鍵撥號',
    description: '產生電話 QR Code，掃碼即可一鍵撥號。免費、不上傳，可下載 PNG / SVG。',
    intro: '輸入電話號碼，產生可一鍵撥號的 QR Code，適合店家、傳單與服務專線。',
    steps: ['輸入電話號碼', '自訂外觀（可選）', '下載並張貼'],
    faqs: [
      { q: '支援市話與分機嗎？', a: '支援。可輸入含區碼的市話；部分裝置支援分機，建議實機測試。' },
    ],
  },
  {
    type: 'sms', path: '/sms', routeName: 'sms', label: '簡訊',
    h1: '簡訊 SMS QR Code 產生器',
    title: '簡訊 QR Code 產生器｜掃碼帶入號碼與訊息',
    description: '產生簡訊 QR Code，掃碼自動開啟簡訊並帶入號碼與內容。免費、不上傳。',
    intro: '輸入號碼與訊息，產生簡訊 QR Code，常用於活動報名、投票與回覆關鍵字。',
    steps: ['輸入號碼與訊息內容', '自訂外觀（可選）', '下載並使用'],
    faqs: [
      { q: '掃描後會自動送出簡訊嗎？', a: '不會。只會開啟簡訊 App 並帶入號碼與內容，由使用者確認後送出。' },
    ],
  },
]

// 同時收錄無斜線(/wifi，SSG 預渲染)與帶斜線(/wifi/，dirStyle:nested 實際服務網址)兩種 key，
// 避免 client 端在 /wifi/ 載入時查表 undefined 導致頁面空白
export const qrTypeByPath = Object.fromEntries(
  qrTypes.flatMap(t => [[t.path, t], [`${t.path}/`, t]]),
)
export const qrTypeByType = Object.fromEntries(qrTypes.map(t => [t.type, t])) as Record<QrType, QrTypeMeta>
