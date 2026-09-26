export interface OgImage {
  /** 站內路徑（不含子路徑前綴），例如 '/og-default.png' */
  path: string
  width: number
  height: number
  alt: string
}

export const site = {
  // 產品名。頁首、頁尾、FAQ／教學總覽／隱私權／404 的 title 後綴、JSON-LD 的 WebSite 與首頁工具名稱、
  // manifest 都從這裡取，不要在別處寫死。2026-09-26 由 QR Code Studio 改名，網址 /qrcode-studio/ 不變。
  name: 'QR Code 製造機',
  // 英文名。站上沒有英文版，只放進 JSON-LD WebSite.alternateName 與 manifest，讓英文搜尋與舊名對得起來。
  nameEn: 'QR Code Maker',
  // 舊名只留在這裡（JSON-LD alternateName）與關於頁的更新紀錄，其他地方不再出現。更早的 QRTool 已完全停用。
  formerNames: ['QR Code Studio'],
  // og:site_name：產品名＋站群名，分享卡片上看得出這是口袋工具的一部分。
  siteName: 'QR Code 製造機｜口袋工具',
  // 正式網址（含子路徑、無結尾斜線）；用於 canonical / og:url / sitemap / 結構化資料。
  // 舊子網域 qrcode-studio.pocketool.app 由 Cloudflare Bulk Redirect 301 過來。
  url: 'https://www.pocketool.app/qrcode-studio',
  defaultLocale: 'zh-TW',
  // 預設社群分享圖（1200×630）。個別頁面可用 useSeoHead 的 ogImage 覆寫。
  ogImage: {
    path: '/og-default.png',
    width: 1200,
    height: 630,
    alt: 'QR Code 製造機：免費 QR Code 產生器，線上製作、可加 LOGO',
  } satisfies OgImage,
  description: '免費線上 QR Code 產生器，3 步驟製作 QRCode：瀏覽器內即時生成、不傳雲端，可自訂顏色與加入 LOGO，免費下載 PNG 與 SVG 向量檔，永久有效不過期。',
  // 產品名含「QR Code」，頁尾與關於頁都要附這一句註冊商標聲明（DENSO WAVE 官方要求的寫法）。
  trademark: 'QR Code 是 DENSO WAVE INCORPORATED 在日本及其他國家的註冊商標。',
}

// 營運者：口袋工具（站群 hub）。Organization JSON-LD、文章的 publisher、頁首頁尾的
// 站群連結都從這裡取。hub 的頁面網址不帶尾斜線（/about、/contact、/privacy），
// 只有工具總覽是 /tools/。
export const publisher = {
  name: '口袋工具 Pocketool',
  url: 'https://www.pocketool.app/',
  // 512×512 方形 PNG（Google 要求 logo 至少 112×112）。檔案在本 repo 的 public/。
  logo: `${site.url}/pocketool-logo.png`,
  aboutUrl: 'https://www.pocketool.app/about',
  contactUrl: 'https://www.pocketool.app/contact',
  privacyUrl: 'https://www.pocketool.app/privacy',
  toolsUrl: 'https://www.pocketool.app/tools/',
}

// 教學文章的作者。
export const author = {
  name: '卡斯伯',
  url: publisher.aboutUrl,
}

// 原始碼（公開 repo）。關於頁的授權說明連到這裡的 NOTICE.md。
export const repoUrl = 'https://github.com/Wcc723/qrcode-studio'
