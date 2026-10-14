/**
 * 中英成對的頁面：hreflang、語言切換、seo:audit 的成對規則都從這張表來。
 *
 * - 只有表上的頁面放 zh-Hant-TW、en、x-default 三條 hreflang，兩邊互指；x-default 指繁中那一頁
 *   （理由見 AGENTS.md「中英文版」）。其他繁中頁維持原本只指向自己的 zh-Hant-TW 一條。
 * - 語言切換：表上的頁面連到另一個語系的同一頁，沒有對應頁的就連到該語言的首頁。
 * - 新增成對的頁面時：這張表、src/router.ts 的英文路由、scripts/seo/audit.mjs 的 EXPECTED_PAIRS 一起改。
 *
 * 路徑是站內路徑（不含子路徑前綴 /qrcode-studio），一律帶尾斜線，跟 canonical 的寫法一致。
 */
import type { Locale } from './locale'

export interface PagePair {
  zh: string
  en: string
}

export const PAGE_PAIRS: readonly PagePair[] = [
  { zh: '/', en: '/en/' },
  { zh: '/batch/', en: '/en/batch/' },
  { zh: '/barcode/', en: '/en/barcode/' },
]

/** 各語系的首頁 */
export const LOCALE_HOME: Record<Locale, string> = { 'zh-TW': '/', en: '/en/' }

/** `/batch` → `/batch/`；首頁維持 `/` */
export function withTrailingSlash(path: string): string {
  const p = path.split(/[?#]/)[0] || '/'
  return p.endsWith('/') ? p : `${p}/`
}

/** 這一頁所屬的成對頁面；沒有成對就回 null */
export function pairOf(path: string): PagePair | null {
  const p = withTrailingSlash(path)
  return PAGE_PAIRS.find(x => x.zh === p || x.en === p) ?? null
}

/** 語言切換的目的地：另一個語系的同一頁，沒有對應頁就是那個語系的首頁 */
export function switchTarget(path: string, to: Locale): string {
  const pair = pairOf(path)
  if (!pair) return LOCALE_HOME[to]
  return to === 'en' ? pair.en : pair.zh
}
