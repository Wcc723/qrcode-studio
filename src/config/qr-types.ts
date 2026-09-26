import type { QrType } from '@/types'

export interface FaqItem { q: string; a: string }
export interface QrTypeMeta {
  type: QrType
  path: string            // 路由路徑，'' 代表首頁
  label: string           // tab 顯示
  icon: string            // Lucide 圖示的 UnoCSS class（建置時打包）；首頁連結列與產生器分頁共用
  routeName: string
  h1: string
  title: string           // <title>
  description: string     // meta description
  intro: string           // landing 頁開頭段落
  body?: string           // 富內容區（HTML，鋪關鍵字與使用情境）
  steps: string[]         // 使用步驟
  faqs: FaqItem[]         // 類型專屬的問題；通用問題（要錢嗎、會過期嗎）放 /faq/，不要每頁重複
  guides: string[]        // 「延伸閱讀」的教學 slug（src/content/guides.ts），有測試把關存在
}

export const qrTypes: QrTypeMeta[] = [
  {
    type: 'url', path: '/url', routeName: 'url', label: '網址', icon: 'i-lucide-link',
    h1: '網址 QR Code 產生器',
    title: '網址轉 QR Code｜把連結變成 QR Code，免費下載 PNG/SVG',
    description: '免費線上把網址轉成 QR Code，瀏覽器內即時生成、不傳雲端，可自訂顏色與加入 LOGO，免費下載 PNG 與 SVG 向量檔，永久有效不會過期。',
    intro: '輸入任何網址，立即在線上製作可掃描的網址 QR Code。整個過程在你的瀏覽器內完成、不傳雲端，完全免費、無浮水印，還能自訂顏色、加入品牌 LOGO，並下載高解析 PNG 或 SVG 向量檔。',
    body: '<p>網址 QR Code 是最常見的行動條碼用途：把官網、活動頁、Google 表單、線上菜單或社群連結變成一張圖，讓人用手機相機一掃就開啟，省去手動輸入長網址的麻煩。</p><h3>常見應用情境</h3><ul><li><strong>名片與簡報</strong>：把個人網站或作品集放上名片，掃碼直接打開。</li><li><strong>海報與 DM</strong>：活動報名、優惠頁面導流，線下導到線上。</li><li><strong>產品包裝</strong>：說明書、保固登錄、使用教學影片。</li><li><strong>店家點餐</strong>：桌邊掃碼開啟線上菜單或點餐系統。</li></ul><p>本工具產生的是<strong>靜態 QR Code</strong>，網址直接編碼在圖中，永久有效、不需聯網、不會被收回或失效；想印在包裝或招牌上長期使用也沒問題。需要長期重複使用時，建議搭配自己的<strong>短網址</strong>，圖會更簡潔、更好掃。</p>',
    steps: ['貼上或輸入網址（沒有 https 會自動補上）', '自訂前景／背景顏色、加入 LOGO（可選）', '免費下載 PNG 或 SVG 向量檔'],
    faqs: [
      { q: '產生的網址 QR Code 會過期嗎？', a: '不會。這是靜態 QR Code，網址直接編碼在圖中，永久有效、不需聯網、不會失效，可放心印在名片、海報或產品包裝上長期使用。' },
      { q: '我輸入的網址會被上傳嗎？', a: '你輸入的網址只在你的瀏覽器內編碼成 QR Code 圖片，不會上傳至雲端儲存空間。' },
      { q: '可以在網址後面加追蹤參數（UTM）嗎？', a: '可以。網址裡的 ?utm_source=poster 這類參數會原樣編進 QR Code，搭配 Google Analytics 等工具，就能分辨流量來自海報、傳單還是名片。參數越長圖案越密，印得小時記得實際掃一次。' },
      { q: '可以下載向量 SVG 印刷用嗎？', a: '可以。除了 PNG／JPG，也免費提供 SVG 向量檔，無限放大不失真，適合大圖輸出與印刷。' },
      { q: '網址很長會不會掃不到？', a: '網址越長，QR Code 圖案越密。建議使用短網址，或在工具中把容錯等級調低、尺寸調大，都能提升掃描成功率。' },
    ],
    guides: ['line-qr-code', 'qr-with-logo', 'qr-code-svg'],
  },
  {
    type: 'wifi', path: '/wifi', routeName: 'wifi', label: 'WiFi', icon: 'i-lucide-wifi',
    h1: 'WiFi QR Code 產生器',
    title: 'WiFi QR Code 產生器｜免費製作，掃碼免輸密碼自動連線',
    description: '免費製作 WiFi QR Code，訪客用手機掃一下即可自動連上無線網路、免手動輸入密碼。瀏覽器內生成、不傳雲端，可自訂外觀並下載 PNG / SVG。',
    intro: '輸入網路名稱（SSID）與密碼，立即產生 WiFi QR Code。貼在店面、民宿、會議室或租屋處，客人用手機相機一掃就自動連線，再也不用一個一個唸密碼。免費、不傳雲端、可自訂外觀。',
    body: '<p>WiFi QR Code 把你的無線網路名稱、密碼與加密方式編碼成一張圖，手機相機（iOS 與 Android 皆內建支援）掃描後會跳出「加入網路」提示，一鍵即可連線，特別適合人來人往、常被問密碼的場所。</p><h3>最適合的使用場景</h3><ul><li><strong>餐廳、咖啡廳</strong>：印在桌卡或牆上，免去櫃台一直報密碼。</li><li><strong>民宿、Airbnb、飯店</strong>：放在房卡或說明手冊，提升入住體驗。</li><li><strong>公司會議室、活動現場</strong>：訪客自助連線。</li><li><strong>租屋、家中訪客</strong>：朋友來訪掃碼即連。</li></ul><p>所有資訊都<strong>只在你的瀏覽器內</strong>編碼成圖片，不會上傳至雲端儲存空間；不過任何掃到這張圖的人都能連上你的網路，建議張貼在你能控制的場所，並可考慮為訪客開設獨立的訪客網路。</p>',
    steps: ['輸入 WiFi 名稱（SSID）與密碼、選擇加密方式（WPA/WPA2）', '自訂顏色或加入店家 LOGO（可選）', '下載並列印張貼'],
    faqs: [
      { q: 'WiFi QR Code 怎麼做？', a: '在上方輸入網路名稱（SSID）與密碼、選好加密方式（一般家用與店家多為 WPA/WPA2），預覽會即時更新，再按下載印出張貼即可，完全免費。' },
      { q: '支援哪些加密方式？', a: '支援 WPA/WPA2、WEP，以及開放網路（無密碼）。大多數家用與商用路由器都是 WPA/WPA2。' },
      { q: 'iPhone 和 Android 都能掃嗎？', a: '都可以。iOS 與 Android 的內建相機掃描後即會跳出加入 WiFi 的提示，不需另外安裝 App。' },
      { q: 'WiFi 密碼會被上傳嗎？', a: '密碼只在你的瀏覽器內編碼成 QR Code 圖片，不會上傳至雲端儲存空間。但請注意，任何掃到該圖的人都能連線，建議張貼於可控場所。' },
      { q: '換了密碼怎麼辦？', a: '靜態 QR Code 無法事後修改，更換密碼後重新產生一張、替換張貼的圖即可。' },
    ],
    guides: ['qr-code-svg', 'scan-qr-code', 'error-correction'],
  },
  {
    type: 'vcard', path: '/vcard', routeName: 'vcard', label: '電子名片', icon: 'i-lucide-contact',
    h1: '電子名片 vCard QR Code 產生器',
    title: '電子名片 QR Code 產生器｜vCard 一掃存入通訊錄（免費）',
    description: '免費製作電子名片 vCard QR Code，對方掃碼即可把姓名、電話、Email、公司一鍵存入手機通訊錄。瀏覽器內生成、不傳雲端，可加 LOGO 下載 PNG/SVG。',
    intro: '輸入姓名、電話、Email、公司等聯絡資訊，產生電子名片 QR Code（vCard）。對方掃描後可直接把你存進手機通訊錄，最適合放在紙本名片、Email 簽名檔或展場攤位，省去手動輸入。',
    body: '<p>電子名片 QR Code 採用標準 <strong>vCard</strong> 格式，把你的聯絡資訊打包成一張圖；iOS 與 Android 相機掃描後即可一鍵「加入聯絡人」，比交換紙本名片更快、更不容易出錯，也更環保。</p><h3>誰適合用</h3><ul><li><strong>業務、創業者、自由工作者</strong>：印在名片背面或當電子名片直接傳。</li><li><strong>Email 簽名檔</strong>：對方手機掃信末的 QR 就能存聯絡方式。</li><li><strong>展場、活動攤位</strong>：海報貼一張，來客自行掃存。</li></ul><p>可填寫姓名、電話、Email、公司、職稱、地址與網站，留空的欄位會自動省略。所有資料都在<strong>瀏覽器內生成、不傳雲端</strong>，可放心填寫個人聯絡資訊。</p>',
    steps: ['填寫姓名、電話、Email、公司等資訊', '自訂顏色或加入 LOGO（可選）', '下載並印在名片或放進簽名檔'],
    faqs: [
      { q: '掃描後能直接存進通訊錄嗎？', a: '可以。採用標準 vCard 3.0 格式，iOS 與 Android 相機掃描後皆可一鍵加入聯絡人，無需安裝 App。' },
      { q: '可以放公司、職稱與地址嗎？', a: '可以。支援姓名、電話、Email、公司、職稱、地址與網站等欄位，留空的欄位會自動省略。' },
      { q: '可以放 LINE ID 或社群帳號嗎？', a: '目前的欄位沒有 LINE ID 與社群帳號。可以把 LINE 加好友網址或個人網站填在「網站」欄，對方存進通訊錄後就能點開。欄位填得越多，QR Code 越密，印在名片上時建議只留最常用的幾項。' },
      { q: '我的聯絡資訊會外洩嗎？', a: '你的聯絡資訊只在你的瀏覽器內編碼成 QR Code 圖片，不會上傳至雲端儲存空間。' },
    ],
    guides: ['qr-with-logo', 'qr-code-svg', 'what-is-qr-code'],
  },
  {
    type: 'text', path: '/text', routeName: 'text', label: '純文字', icon: 'i-lucide-type',
    h1: '純文字 QR Code 產生器',
    title: '文字 QR Code 產生器｜任意文字轉 QR Code（免費線上）',
    description: '免費線上把任意文字轉成 QR Code，瀏覽器內即時生成、不傳雲端，可自訂顏色與 LOGO，下載 PNG / SVG。適合序號、留言、說明與活動暗號。',
    intro: '輸入任何文字內容，立即產生純文字 QR Code。掃描後會直接顯示文字，不需開啟網頁，適合產品序號、設備編號、留言卡片、活動暗號或簡短說明。免費、不傳雲端、可自訂外觀。',
    body: '<p>文字 QR Code 把純文字直接編碼在圖中，掃描時手機會原樣顯示內容、不會連到任何網站，安全又單純。常見於需要快速傳遞一段固定資訊、又不想做成網頁的情境。</p><h3>常見用途</h3><ul><li><strong>產品序號、設備編號、財產標籤</strong>：盤點、報修一掃就知。</li><li><strong>展覽、教學</strong>：作品說明、解答、提示卡。</li><li><strong>活動與遊戲</strong>：闖關暗號、線索卡。</li></ul><p>QR Code 容量有限，文字越長圖案越密、越難掃；內容過長時工具會提示，建議精簡文字或提高尺寸。所有內容都在<strong>瀏覽器內生成、不傳雲端</strong>。</p>',
    steps: ['輸入文字內容', '自訂顏色或加入 LOGO（可選）', '免費下載 PNG 或 SVG'],
    faqs: [
      { q: '可以放多長的文字？', a: 'QR Code 容量有限，文字越長圖案越密。過長時建議縮短內容、調大尺寸或降低容錯等級；超出容量時工具會提示。' },
      { q: '掃描後會開啟網頁嗎？', a: '不會。純文字 QR Code 掃描後只會顯示文字內容，不會連到任何網站，單純又安全。' },
      { q: '支援中文與表情符號嗎？', a: '支援。可輸入中文、英數與符號；中文等多位元字元會佔較多容量，內容請盡量精簡。' },
      { q: '文字 QR Code 和網址 QR Code 差在哪？', a: '文字 QR Code 掃描後只顯示文字，不會連到任何地方，適合序號、提示卡與闖關暗號。內容很長或之後可能修改時，建議把內容放在網頁上改用網址 QR Code，圖案會簡單很多，也能隨時更新內容。' },
    ],
    guides: ['what-is-qr-code', 'error-correction', 'scan-qr-code'],
  },
  {
    type: 'email', path: '/email', routeName: 'email', label: 'Email', icon: 'i-lucide-mail',
    h1: 'Email QR Code 產生器',
    title: 'Email QR Code 產生器｜掃碼直接寄信（免費、可帶主旨內文）',
    description: '免費製作 Email QR Code，掃碼自動開啟郵件 App 並帶入收件者、主旨與內文。瀏覽器內生成、不傳雲端，可自訂外觀並下載 PNG / SVG。',
    intro: '輸入收件者、主旨與內文，產生可直接寄信的 Email QR Code。掃描後會自動開啟郵件 App 並帶好內容，使用者確認後送出即可，方便客服、報修、活動報名與表單回收。免費、不傳雲端。',
    body: '<p>Email QR Code 使用標準 <code>mailto:</code> 連結，把收件信箱、主旨與內文編碼成圖；掃描後手機會開啟預設郵件 App 並自動填好欄位，降低聯絡門檻、提高回信率。</p><h3>適合的場景</h3><ul><li><strong>客服與報修</strong>：海報貼一張，客人掃碼直接寄信。</li><li><strong>活動報名、意見回饋</strong>：預填主旨方便分類處理。</li><li><strong>名片與簽名檔</strong>：一掃即寄信給你。</li></ul><p>掃描<strong>不會自動寄出</strong>，只會帶入內容，由使用者確認後送出，安全有保障。整個產生過程在瀏覽器內完成、不傳雲端。</p>',
    steps: ['輸入收件者、主旨、內文', '自訂顏色或加入 LOGO（可選）', '下載並使用'],
    faqs: [
      { q: '掃描後會自動寄出嗎？', a: '不會。只會開啟郵件 App 並帶入收件者、主旨與內文，由使用者確認後手動送出，不會擅自寄信。' },
      { q: '可以預先填好主旨和內文嗎？', a: '可以。填寫主旨與內文後即會一併編碼，掃描後郵件 App 會自動帶入，方便分類與快速回覆。' },
      { q: '可以加副本（CC）嗎？', a: '目前只提供收件者、主旨與內文三個欄位，沒有副本與密件副本。需要讓多人收到時，建議收件者填一個共用的群組信箱。' },
    ],
    guides: ['scan-qr-code', 'qr-with-logo', 'qr-code-svg'],
  },
  {
    type: 'phone', path: '/phone', routeName: 'phone', label: '電話', icon: 'i-lucide-phone',
    h1: '電話 QR Code 產生器',
    title: '電話 QR Code 產生器｜掃碼一鍵撥號（免費線上製作）',
    description: '免費線上製作電話 QR Code，掃碼即可一鍵撥號，免手動輸入號碼。瀏覽器內生成、不傳雲端，可自訂外觀並下載 PNG / SVG。適合店家、傳單與服務專線。',
    intro: '輸入電話號碼，立即產生可一鍵撥號的電話 QR Code。掃描後手機會直接帶出撥號畫面，適合店家招牌、傳單、菜單與客服專線，讓客人少打幾個字、快速聯絡你。免費、不傳雲端。',
    body: '<p>電話 QR Code 使用標準 <code>tel:</code> 連結把號碼編碼成圖；掃描後手機會自動跳到撥號畫面，按下即可通話，省去手動輸入、避免打錯號碼。</p><h3>常見用途</h3><ul><li><strong>店家招牌、外送傳單</strong>：掃碼直撥訂位或訂餐專線。</li><li><strong>客服與維修</strong>：機台上貼一張，故障一掃就撥。</li><li><strong>名片</strong>：掃碼直接撥給你。</li></ul><p>支援含區碼的市話與手機號碼。所有內容在<strong>瀏覽器內生成、不傳雲端</strong>，免費、無浮水印。</p>',
    steps: ['輸入電話號碼（可含區碼）', '自訂顏色或加入 LOGO（可選）', '下載並張貼'],
    faqs: [
      { q: '掃描後會自動撥打嗎？', a: '不會自動撥出。掃描後手機會跳到撥號畫面並帶好號碼，由使用者按下才撥打。' },
      { q: '支援市話、手機與分機嗎？', a: '支援含區碼的市話與手機號碼；部分裝置支援分機（如 02-1234-5678,123），建議實機測試。' },
      { q: '要給國外的人掃，號碼怎麼寫？', a: '用國際格式：+886 加上去掉開頭 0 的號碼。例如市話 02-1234-5678 寫成 +886212345678，手機 0912-345-678 寫成 +886912345678。只在台灣使用的話直接輸入 0912345678 即可，空格與連字號會自動去掉。' },
    ],
    guides: ['scan-qr-code', 'qr-code-svg', 'qr-with-logo'],
  },
  {
    type: 'sms', path: '/sms', routeName: 'sms', label: '簡訊', icon: 'i-lucide-message-square',
    h1: '簡訊 SMS QR Code 產生器',
    title: '簡訊 QR Code 產生器｜掃碼帶入號碼與內容（免費）',
    description: '免費製作簡訊 SMS QR Code，掃碼自動開啟簡訊並帶入收件號碼與內容。瀏覽器內生成、不傳雲端，可自訂外觀並下載 PNG / SVG。適合活動報名與投票。',
    intro: '輸入收件號碼與訊息內容，產生簡訊 QR Code。掃描後會自動開啟簡訊 App 並帶好號碼與內容，常用於活動報名、抽獎投票與回覆指定關鍵字。免費、不傳雲端、可自訂外觀。',
    body: '<p>簡訊 QR Code 使用 <code>SMSTO</code> 格式，把收件號碼與預設訊息編碼成圖；掃描後手機會開啟簡訊 App 並自動填好，使用者確認後送出即可，常見於需要「回覆關鍵字」的行銷活動。</p><h3>適合的活動</h3><ul><li><strong>活動報名、抽獎投票</strong>：掃碼自動帶好指定簡訊內容。</li><li><strong>會員加入、優惠領取</strong>：回覆關鍵字啟動流程。</li></ul><p>掃描<strong>不會自動送出</strong>簡訊，僅帶入內容由使用者確認。整個過程在瀏覽器內完成、不傳雲端。</p>',
    steps: ['輸入收件號碼與訊息內容', '自訂顏色或加入 LOGO（可選）', '下載並使用'],
    faqs: [
      { q: '掃描後會自動送出簡訊嗎？', a: '不會。只會開啟簡訊 App 並帶入號碼與內容，由使用者確認後手動送出，不會擅自發送。' },
      { q: '可以預先填好訊息內容嗎？', a: '可以。填寫訊息後即一併編碼，特別適合活動「回覆指定關鍵字」的玩法。' },
      { q: 'iPhone 和 Android 掃出來一樣嗎？要付簡訊費嗎？', a: '本工具採用 SMSTO:號碼:內容 這個通用格式，iPhone 與 Android 的內建相機都能開啟簡訊並帶入內容，但各機型帶入的方式可能略有差異，印刷前請兩種手機各掃一次。QR Code 本身免費，按下送出時的簡訊費用依傳送者自己的電信方案計算。' },
    ],
    guides: ['scan-qr-code', 'what-is-qr-code', 'qr-code-svg'],
  },
]

// 同時收錄無斜線(/wifi，SSG 預渲染)與帶斜線(/wifi/，dirStyle:nested 實際服務網址)兩種 key，
// 避免 client 端在 /wifi/ 載入時查表 undefined 導致頁面空白
export const qrTypeByPath = Object.fromEntries(
  qrTypes.flatMap(t => [[t.path, t], [`${t.path}/`, t]]),
)
export const qrTypeByType = Object.fromEntries(qrTypes.map(t => [t.type, t])) as Record<QrType, QrTypeMeta>
