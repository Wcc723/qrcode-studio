import { useHead } from '@unhead/vue'
import type { Script } from '@unhead/vue'
import { site, publisher, author, type OgImage } from '@/config/site'
import { DEFAULT_LOCALE, LANG_TAG, OG_LOCALE, type Locale } from '@/i18n/locale'
import { pairOf } from '@/i18n/pairs'

export type AppLdType = 'SoftwareApplication' | 'WebApplication'
export type PageLdType = 'WebPage' | 'AboutPage' | 'CollectionPage'
/** 頁面類型：工具頁（app）、教學文章（article）、一般頁面（page：關於、隱私權、FAQ、索引）。 */
export type SeoKind = 'app' | 'article' | 'page'

export interface Crumb { name: string; url: string }

// publisher 只放參照：用共用 @id 對到同一個 Organization 節點，另帶 name 與 url，單獨拿出這一段也看得懂。
// logo 等完整屬性只寫在 buildOrganizationLd 那一份（同一頁、同一個 @id）。
function publisherLd() {
  return { '@type': 'Organization', '@id': publisher.id, name: publisher.name, url: publisher.url }
}

// alternateName：另一個語言的名字與舊名（site.ts 的 nameEn、formerNames），讓用英文名、中文名或舊名找的人對得到同一個網站。
// 中英兩版是同一個網站（網址都是 ${site.url}/），只是名字跟著頁面的語言。
function websiteRef(locale: Locale = DEFAULT_LOCALE) {
  return locale === 'en'
    ? { '@type': 'WebSite', name: site.nameEn, alternateName: [site.name, ...site.formerNames], url: `${site.url}/` }
    : { '@type': 'WebSite', name: site.name, alternateName: [site.nameEn, ...site.formerNames], url: `${site.url}/` }
}

export function buildSoftwareAppLd(p: { name: string; url: string; description: string; appType?: AppLdType; locale?: Locale }) {
  const locale = p.locale ?? DEFAULT_LOCALE
  return {
    // WebApplication 是 SoftwareApplication 的子類別，同一組屬性完全通用。
    // 預設維持 SoftwareApplication；/scan/ 與 /barcode/ 用 WebApplication。
    '@context': 'https://schema.org', '@type': p.appType ?? 'SoftwareApplication',
    name: p.name, url: p.url, description: p.description,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: locale === 'en' ? 'USD' : 'TWD' },
    inLanguage: LANG_TAG[locale],
    isPartOf: websiteRef(locale),
    publisher: publisherLd(),
  }
}

export function buildArticleLd(p: {
  title: string; url: string; description: string
  published: string; modified: string; image: string
}) {
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: p.title, description: p.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': p.url },
    datePublished: p.published,
    dateModified: p.modified,
    image: [p.image],
    author: { '@type': 'Person', name: author.name, url: author.url },
    publisher: publisherLd(),
    isPartOf: websiteRef(),
    inLanguage: LANG_TAG[DEFAULT_LOCALE],
  }
}

export function buildWebPageLd(p: { type: PageLdType; name: string; url: string; description: string; locale?: Locale }) {
  const locale = p.locale ?? DEFAULT_LOCALE
  return {
    '@context': 'https://schema.org', '@type': p.type,
    name: p.name, url: p.url, description: p.description,
    inLanguage: LANG_TAG[locale],
    isPartOf: websiteRef(locale),
    publisher: publisherLd(),
  }
}

// 全站一份，放 App.vue。營運者是口袋工具（站群 hub），不是這個工具本身；本產品的名稱留在 WebSite。
// @id 跟各頁 publisher 的參照是同一個，一頁裡只會有這一個 Organization 實體。
export function buildOrganizationLd() {
  return {
    '@context': 'https://schema.org', '@type': 'Organization', '@id': publisher.id,
    name: publisher.name, alternateName: publisher.alternateName, url: publisher.url, logo: publisher.logo,
  }
}

export function buildBreadcrumbLd(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

export interface SeoHeadOptions {
  title: string
  description: string
  path: string
  breadcrumbs?: Crumb[]
  /** 預設 'app' */
  kind?: SeoKind
  /** kind=app：JSON-LD 的工具名稱。用乾淨的工具名，不要拿 <title> 那串 SEO 修飾語。 */
  appName?: string
  appType?: AppLdType
  /** kind=page：預設 WebPage */
  pageType?: PageLdType
  /** kind=article：YYYY-MM-DD，來自 src/content/guides.ts 的真實日期 */
  dates?: { published: string; modified: string }
  /** 覆寫預設分享圖 */
  ogImage?: OgImage
  /** 這一頁的語言，預設繁中。決定 og:locale、og:site_name、JSON-LD 的 inLanguage 與 WebSite 名稱 */
  locale?: Locale
}

/** 把 path 正規化成帶尾斜線的正式網址（首頁是 `${site.url}/`）。 */
export function canonicalUrl(path: string): string {
  const normalizedPath = path === '/' ? '/' : `${path.replace(/\/$/, '')}/`
  return `${site.url}${normalizedPath}`
}

export function buildPrimaryLd(opts: SeoHeadOptions, url: string, ogImageUrl: string) {
  const kind = opts.kind ?? 'app'
  if (kind === 'article') {
    if (!opts.dates) throw new Error(`[useSeoHead] 文章頁必須帶 dates：${opts.path}`)
    return buildArticleLd({
      title: opts.title, url, description: opts.description,
      published: opts.dates.published, modified: opts.dates.modified, image: ogImageUrl,
    })
  }
  const locale = opts.locale ?? DEFAULT_LOCALE
  if (kind === 'page') {
    return buildWebPageLd({ type: opts.pageType ?? 'WebPage', name: opts.title, url, description: opts.description, locale })
  }
  const appName = opts.appName ?? (locale === 'en' ? site.nameEn : site.name)
  return buildSoftwareAppLd({ name: appName, url, description: opts.description, appType: opts.appType, locale })
}

/**
 * hreflang：中英成對的頁面（src/i18n/pairs.ts）放 zh-Hant-TW、en、x-default 三條，兩邊互指，x-default 指繁中那一頁；
 * 其他頁維持只指向自己的一條（繁中頁一向如此，沒有英文版的頁不多放）。
 */
export function hreflangLinks(path: string, locale: Locale = DEFAULT_LOCALE): { rel: 'alternate'; hreflang: string; href: string }[] {
  const pair = pairOf(path)
  if (!pair) return [{ rel: 'alternate', hreflang: LANG_TAG[locale], href: canonicalUrl(path) }]
  return [
    { rel: 'alternate', hreflang: LANG_TAG['zh-TW'], href: canonicalUrl(pair.zh) },
    { rel: 'alternate', hreflang: LANG_TAG.en, href: canonicalUrl(pair.en) },
    { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl(pair.zh) },
  ]
}

// 注意：刻意不產 FAQPage。Google 於 2026-05-07 起停止顯示 FAQ rich results，
// 該 schema 已無可見 SERP 收益；頁面上的 FAQ 文字內容照常保留（對長尾與 UX 仍有用）。
export function useSeoHead(opts: SeoHeadOptions) {
  const url = canonicalUrl(opts.path)
  const image = opts.ogImage ?? site.ogImage
  const ogImageUrl = `${site.url}${image.path}`
  const kind = opts.kind ?? 'app'
  const locale = opts.locale ?? DEFAULT_LOCALE
  const scripts: Script[] = [
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildPrimaryLd(opts, url, ogImageUrl)) },
  ]
  if (opts.breadcrumbs?.length) {
    scripts.push({ type: 'application/ld+json', innerHTML: JSON.stringify(buildBreadcrumbLd(opts.breadcrumbs)) })
  }
  const meta = [
    { name: 'description', content: opts.description },
    { property: 'og:title', content: opts.title },
    { property: 'og:description', content: opts.description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: kind === 'article' ? 'article' : 'website' },
    { property: 'og:site_name', content: locale === 'en' ? site.siteNameEn : site.siteName },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    { property: 'og:image', content: ogImageUrl },
    { property: 'og:image:width', content: String(image.width) },
    { property: 'og:image:height', content: String(image.height) },
    { property: 'og:image:type', content: /\.jpe?g$/i.test(image.path) ? 'image/jpeg' : 'image/png' },
    { property: 'og:image:alt', content: image.alt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: opts.title },
    { name: 'twitter:description', content: opts.description },
    { name: 'twitter:image', content: ogImageUrl },
    { name: 'twitter:image:alt', content: image.alt },
  ]
  if (kind === 'article' && opts.dates) {
    meta.push({ property: 'article:published_time', content: opts.dates.published })
    meta.push({ property: 'article:modified_time', content: opts.dates.modified })
  }
  useHead({
    title: opts.title,
    meta,
    link: [
      { rel: 'canonical', href: url },
      ...hreflangLinks(opts.path, locale),
    ],
    script: scripts,
  })
}
