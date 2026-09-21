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
  description: string
  /** 第一次上線的日期（YYYY-MM-DD），以 git 歷史為準，不要改成「看起來比較新」的日期 */
  published: string
  /** 最後一次實質改寫內容的日期（YYYY-MM-DD）。只改錯字、連結不算，不必動它 */
  updated: string
  /** 教學總覽頁的分組 */
  category: GuideCategory
}

export const guides: Guide[] = [
  {
    slug: 'what-is-qr-code',
    published: '2026-05-29',
    updated: '2026-09-13',
    title: '什麼是 QR Code？原理、用途與安全性完整介紹',
    description: 'QR Code（行動條碼）是什麼？一次看懂二維條碼的運作原理、容量、靜態與動態差異、常見用途與掃描安全注意事項。',
    category: 'basics',
  },
  {
    slug: 'error-correction',
    published: '2026-05-29',
    updated: '2026-05-30',
    title: 'QR Code 容錯等級怎麼選？L/M/Q/H 一次搞懂',
    description: '容錯等級（L/M/Q/H）影響 QR Code 的抗污損能力與圖案密度。本文教你依用途與是否加 LOGO 正確挑選容錯等級。',
    category: 'design',
  },
  {
    slug: 'qr-with-logo',
    published: '2026-05-29',
    updated: '2026-06-01',
    title: '如何在 QR Code 中加入 LOGO 又能正常掃描？',
    description: '在 QR Code 加 LOGO 會影響掃描嗎？教你用容錯等級、覆蓋比例與留白做出可正常掃描的品牌造型 QR Code。',
    category: 'design',
  },
  {
    slug: 'scan-qr-code',
    published: '2026-05-30',
    updated: '2026-09-20',
    title: '如何掃描 QR Code？手機相機、LINE、電腦掃描教學',
    description: 'QR Code 怎麼掃？教你用 iPhone／Android 內建相機、LINE 行動條碼掃描器，以及在電腦（Windows/Mac）掃描或讀取 QR Code 的方法。',
    category: 'basics',
  },
  {
    slug: 'line-qr-code',
    published: '2026-05-30',
    updated: '2026-05-30',
    title: 'LINE QR Code 怎麼做？製作與分享行動條碼教學',
    description: 'LINE QR Code 怎麼產生與分享？教你取得個人 LINE 行動條碼、把官網或活動連結做成 QR Code，以及用 LINE 掃描 QR Code 的方法。',
    category: 'use',
  },
  {
    slug: 'qr-code-svg',
    published: '2026-05-30',
    updated: '2026-06-01',
    title: 'QR Code 下載 SVG 向量檔：印刷不失真完整教學',
    description: '需要印刷用的 QR Code？本文說明 SVG 向量與 PNG 點陣的差別、何時該用 SVG，以及如何免費下載高解析、放大不失真的 QR Code。',
    category: 'design',
  },
]
export const guideBySlug: Record<string, Guide> = Object.fromEntries(guides.map(g => [g.slug, g]))

/** 只認得自己的 slug：`constructor`、`__proto__` 這類繼承來的屬性名不算。 */
export function findGuide(slug: string): Guide | undefined {
  return Object.hasOwn(guideBySlug, slug) ? guideBySlug[slug] : undefined
}
