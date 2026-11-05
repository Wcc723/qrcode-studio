// 教學的中繼資料（標題、描述、日期、分組）。這一份會被首頁、頁尾、教學總覽與 router
// 靜態 import，所以留在 entry chunk 裡；文章本文放在 guide-bodies.ts，只有文章頁
// （動態載入）才會用到，不要把本文搬回這裡，否則全站每一頁都要多下載六篇文章。

export type GuideCategory = 'basics' | 'design' | 'use'

export const guideCategories: { id: GuideCategory; label: string }[] = [
  { id: 'basics', label: '入門：認識與掃描' },
  { id: 'design', label: '製作與印刷' },
  { id: 'use', label: '應用情境' },
]

export interface Guide {
  slug: string
  title: string
  /** 頁尾、相關教學等空間小的地方用的短標題 */
  shortTitle: string
  description: string
  /** 第一次上線的日期（YYYY-MM-DD），以 git 歷史為準，不要改成「看起來比較新」的日期 */
  published: string
  /** 最後一次實質改寫內容的日期（YYYY-MM-DD）。只改錯字、連結不算，不必動它 */
  updated: string
  /** 教學總覽頁的分組 */
  category: GuideCategory
  /** 文末「相關教學」，依閱讀順序排；只能填存在的 slug、不能填自己（有測試把關） */
  related: string[]
}

export const guides: Guide[] = [
  {
    slug: 'what-is-qr-code',
    shortTitle: 'QR Code 是什麼',
    published: '2026-05-29',
    updated: '2026-09-21',
    title: '什麼是 QR Code？原理、版本容量與安全性完整介紹',
    description: 'QR Code（行動條碼）是什麼？透過分色構造圖看懂角落方框等固定圖形原理，查表掌握 40 個版本能放多少數字、網址與中文容量，並說明靜態與動態 QR Code 的差別與日常掃描安全重點。',
    category: 'basics',
    related: ['scan-qr-code', 'error-correction', 'qr-code-svg'],
  },
  {
    slug: 'error-correction',
    shortTitle: '容錯等級怎麼選',
    published: '2026-05-29',
    updated: '2026-09-21',
    title: 'QR Code 容錯等級怎麼選？L/M/Q/H 一次搞懂',
    description: 'QR Code 容錯等級與容錯率怎麼看？L/M/Q/H 分別能還原 7% 到 30% 資料。提供同網址四種等級的圖案疏密對照、使用情境挑選建議表，並說明本站加 LOGO 時如何自動調整容錯與 LOGO 大小。',
    category: 'design',
    related: ['qr-with-logo', 'qr-code-svg', 'what-is-qr-code'],
  },
  {
    slug: 'qr-with-logo',
    shortTitle: '加 LOGO 也掃得到',
    published: '2026-05-29',
    updated: '2026-09-21',
    title: '如何在 QR Code 中加入 LOGO 又能正常掃描？',
    description: 'QR Code 加 LOGO 會不會掃不到？解析中間放圖片能正常讀取的容錯原理，並說明本站如何依容錯等級自動控制 LOGO 大小、圖檔形狀與透明背景注意事項、顏色對比調整技巧，以及送印前的掃描檢查清單。',
    category: 'design',
    related: ['error-correction', 'qr-code-svg', 'line-qr-code'],
  },
  {
    slug: 'scan-qr-code',
    shortTitle: '手機與電腦怎麼掃',
    published: '2026-05-30',
    updated: '2026-09-21',
    title: '如何掃描 QR Code？手機相機、LINE、電腦掃描教學',
    description: 'QR Code 怎麼掃？手機不必額外安裝 App，用 iPhone 相機與控制中心、Android 相機與 Google 智慧鏡頭、LINE 就能直接讀取；電腦螢幕上的截圖也能輕鬆解碼。整理各平台官方操作步驟，以及掃不到、沒反應時的排除方法。',
    category: 'basics',
    related: ['what-is-qr-code', 'line-qr-code', 'qr-code-svg'],
  },
  {
    slug: 'line-qr-code',
    shortTitle: 'LINE QR Code',
    published: '2026-05-30',
    updated: '2026-09-21',
    title: 'LINE QR Code 怎麼做？製作與分享行動條碼教學',
    description: 'LINE QR Code 與 LINE 條碼怎麼做？教學整理個人行動條碼與官方帳號加好友 QR Code 的取得步驟，解析 lin.ee 與 line.me 網址格式差異，並說明如何把加好友連結製作成可加 LOGO、適合印刷的專屬 QR Code。',
    category: 'use',
    related: ['qr-with-logo', 'scan-qr-code', 'qr-code-svg'],
  },
  {
    slug: 'qr-code-svg',
    shortTitle: 'SVG 與印刷尺寸',
    published: '2026-05-30',
    updated: '2026-09-21',
    title: 'QR Code 下載 SVG 向量檔：印刷不失真完整教學',
    description: '印刷用 QR Code 該選 SVG 還是 PNG？完整解析向量與點陣圖差異，提供 2 到 30 公分實體尺寸與像素換算表、模組大小與掃描距離公式，並說明四周白邊（靜區）規範與送印前檢查清單。',
    category: 'design',
    related: ['qr-with-logo', 'error-correction', 'what-is-qr-code'],
  },
  {
    slug: 'excel-qr-code-barcode',
    shortTitle: 'Excel 做 QR Code 與條碼',
    published: '2026-10-15',
    updated: '2026-10-15',
    title: 'Excel 怎麼做 QR Code 與條碼？從公式到合併列印',
    description: 'Excel 清單怎麼變成 QR Code 與條碼？整理試算表實用做法：IMAGE 函數公式搭配線上服務、Code 39 條碼字型，或用 Word 合併列印套印標籤。附可複製公式、適用軟體版本，以及清單資料會不會離開電腦。',
    category: 'use',
    related: ['qr-code-svg', 'scan-qr-code', 'what-is-qr-code'],
  },
]
export const guideBySlug: Record<string, Guide> = Object.fromEntries(guides.map(g => [g.slug, g]))

/** 只認得自己的 slug：`constructor`、`__proto__` 這類繼承來的屬性名不算。 */
export function findGuide(slug: string): Guide | undefined {
  return Object.hasOwn(guideBySlug, slug) ? guideBySlug[slug] : undefined
}
