// 此檔由共用頁尾正本同步（版本 1.2.0），不要在這裡改。
// pocketool-footer-data.mjs 的型別（給 TypeScript 的站；實作與註解在 .mjs）。

export type PocketoolFooterLocale = 'zh-Hant' | 'zh-Hans' | 'en' | 'ja' | 'ko'
export type PocketoolTextLocale = 'zh-Hant' | 'en' | 'ja' | 'ko'
export type PocketoolSiteKey =
  | 'pocket-tool-blog'
  | 'pocket-time'
  | 'compound-calculator'
  | 'office-tools'
  | 'taiwan-zipcode'
  | 'qrcode-studio'
  | 'kaomoji-garden'
  | 'pixel-smith'
  | 'device-tester'

export declare const POCKETOOL_FOOTER_VERSION: string
export declare const POCKETOOL_ORIGIN: string
export declare const POCKETOOL_HUB_SITE: 'pocket-tool-blog'
export declare const POCKETOOL_FOOTER_LOCALES: readonly PocketoolFooterLocale[]
export declare const POCKETOOL_TARGET_FALLBACK: Readonly<Record<PocketoolFooterLocale, PocketoolFooterLocale>>
export declare const POCKETOOL_OWNER_LINE: {
  readonly text: string
  readonly href: string
  readonly hubHref: string
  readonly lang: 'zh-Hant'
}

export interface PocketoolSiteEntry {
  key: PocketoolSiteKey
  name: Partial<Record<PocketoolTextLocale, string>> & { 'zh-Hant': string }
  href: Partial<Record<PocketoolFooterLocale, string>> & { 'zh-Hant': string }
  desc: Record<PocketoolTextLocale, string>
}
export declare const POCKETOOL_SITES: readonly PocketoolSiteEntry[]

export interface PocketoolInfoLinkEntry {
  key: string
  href?: Partial<Record<PocketoolFooterLocale, string>> & { 'zh-Hant': string }
  url?: string
  urlLang?: string
  external?: boolean
  label: Record<PocketoolTextLocale, string>
}
export declare const POCKETOOL_INFO_LINKS: readonly PocketoolInfoLinkEntry[]

export declare const POCKETOOL_FOOTER_COPY: Readonly<
  Record<PocketoolTextLocale, { sites: string; info: string; languages: string; home: string; note: string; copyright: string }>
>

export interface PocketoolFooterLink {
  href: string
  /** 只有 hub 上連到其他站時是 _self */
  target: '_self' | undefined
  /** 連結目標的語言跟頁面語系不同時才有 */
  hreflang: string | undefined
}
export interface PocketoolFooterSite extends PocketoolFooterLink {
  key: PocketoolSiteKey
  name: string
  /** 站名不是頁尾文字的語言時才有（例如日文頁上的英文站名） */
  nameLang: string | undefined
  desc: string
  current: boolean
}
export interface PocketoolFooterInfoLink extends PocketoolFooterLink {
  key: string
  label: string
  external: boolean
}
/** 語系列的一筆（站傳給元件的 languages prop）：順序就是畫面上的順序 */
export interface PocketoolFooterLanguageInput {
  /** 那個語言的 BCP 47 代碼，也是去處的 hreflang */
  lang: string
  /** 那個語言自己的名稱（「English」「한국어」） */
  label: string
  /** 這一頁在那個語言的去處；current 那一筆不用 */
  href?: string
  /** 這一頁的語言 */
  current?: boolean
}
export interface PocketoolFooterLanguage {
  lang: string
  label: string
  /** current 那一筆是 undefined（畫成純文字） */
  href: string | undefined
  hreflang: string | undefined
  current: boolean
}
export interface PocketoolFooterModel {
  version: string
  site: PocketoolSiteKey
  locale: PocketoolFooterLocale
  /** 共用區塊（.ptf__sites、.ptf__row、.ptf__copy）的 lang：只有簡中頁是 zh-Hant；<footer> 與本站專屬區不標 */
  lang: 'zh-Hant' | undefined
  sitesLabel: string
  sites: PocketoolFooterSite[]
  brand: PocketoolFooterLink & { label: string; zh: boolean; mark: string; srcset: string }
  infoLabel: string
  info: PocketoolFooterInfoLink[]
  languagesLabel: string
  /** 空陣列就不畫語系列 */
  languages: PocketoolFooterLanguage[]
  note: string
  copyright: string
  owner: { text: string; href: string; lang: 'zh-Hant' }
}

export declare function pocketoolFooterTextLocale(locale: PocketoolFooterLocale): PocketoolTextLocale
export declare function pocketoolFooterLanguages(languages?: readonly PocketoolFooterLanguageInput[]): PocketoolFooterLanguage[]
export declare function pocketoolFooterModel(
  site: PocketoolSiteKey | string,
  locale: PocketoolFooterLocale | string,
  languages?: readonly PocketoolFooterLanguageInput[],
): PocketoolFooterModel
