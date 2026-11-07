// 此檔由共用頁尾正本同步（版本 1.3.0），不要在這裡改。
// pocketool-footer.audit.mjs 的型別（給 TypeScript 的站；實作與註解在 .mjs）。
import type { PocketoolFooterLanguageInput, PocketoolFooterLocale, PocketoolSiteKey } from './pocketool-footer-data.mjs'

/**
 * 一個預渲染 HTML 的共用頁尾有沒有照契約；回傳問題清單，空陣列就是過。
 * languages 給了（含空陣列）就逐筆對語系列；沒給只查語系列的格式。
 */
export declare function pocketoolFooterProblems(
  html: string,
  options: { site: PocketoolSiteKey | string; locale: PocketoolFooterLocale | string; languages?: readonly PocketoolFooterLanguageInput[] },
): string[]

/** 開標籤的屬性（名字小寫、值解開 HTML 實體） */
export declare function attrsOf(tag: string): Map<string, string>

/** 去掉標籤、解開實體、合併空白後的字 */
export declare function textOf(fragment: string): string
