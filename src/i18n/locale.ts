/**
 * 語系：繁中（預設，網址不帶前綴）與英文（網址前綴 /en/）。
 *
 * 目前是哪個語系只看路由的 `meta.locale`（src/router.ts 的英文頁才有），App.vue 依它 provide 給整棵元件樹，
 * 同時同步 vue-i18n 的 locale。元件用 useLocale() 取，不直接讀網址：同一個元件在中英兩頁都會用到，
 * 測試掛元件時沒有 router，這裡的預設值就是繁中。
 *
 * 文案不放 vue-i18n 的 messages：批次與標籤紙的字串只能在批次頁的 chunk 裡（不能進 entry chunk），
 * 而且要能帶型別與參數。各區的字典見 src/locales/ui.ts（全站共用的元件）與 src/pure/batch/copy.ts（批次頁）。
 */
import { inject, readonly, ref, type InjectionKey, type Ref } from 'vue'

export type Locale = 'zh-TW' | 'en'

export const DEFAULT_LOCALE: Locale = 'zh-TW'

export const LOCALE_KEY: InjectionKey<Readonly<Ref<Locale>>> = Symbol('qrcode-studio-locale')

/** `<html lang>`、hreflang 與 JSON-LD 的 inLanguage */
export const LANG_TAG: Record<Locale, string> = { 'zh-TW': 'zh-Hant-TW', en: 'en' }

/** og:locale：英文版的目標市場是美國 */
export const OG_LOCALE: Record<Locale, string> = { 'zh-TW': 'zh_TW', en: 'en_US' }

/** 路由 meta 裡的語系；沒寫就是繁中 */
export function localeOfMeta(meta: { locale?: unknown } | undefined): Locale {
  return meta?.locale === 'en' ? 'en' : DEFAULT_LOCALE
}

const fallback = readonly(ref<Locale>(DEFAULT_LOCALE))

/** 目前的語系（App.vue provide）；沒有 provide 時（單獨掛元件的測試）是繁中 */
export function useLocale(): Readonly<Ref<Locale>> {
  return inject(LOCALE_KEY, fallback)
}

declare module 'vue-router' {
  interface RouteMeta {
    /** 英文頁是 'en'；沒寫就是繁中 */
    locale?: Locale
  }
}
