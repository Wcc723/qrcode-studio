import { useHead } from '@unhead/vue'
import type { Script } from '@unhead/vue'
import { site, publisher, author, type OgImage } from '@/config/site'

export type AppLdType = 'SoftwareApplication' | 'WebApplication'
export type PageLdType = 'WebPage' | 'AboutPage' | 'CollectionPage'
/** 頁面類型：工具頁（app）、教學文章（article）、一般頁面（page：關於、隱私權、FAQ、索引）。 */
export type SeoKind = 'app' | 'article' | 'page'

export interface Crumb { name: string; url: string }

const IN_LANGUAGE = 'zh-Hant-TW'

function publisherLd() {
  return {
    '@type': 'Organization',
    name: publisher.name,
    url: publisher.url,
    logo: { '@type': 'ImageObject', url: publisher.logo, width: 512, height: 512 },
  }
}

// alternateName：英文名與舊名（site.ts 的 nameEn、formerNames），讓用英文名或舊名找的人對得到同一個網站。
function websiteRef() {
  return { '@type': 'WebSite', name: site.name, alternateName: [site.nameEn, ...site.formerNames], url: `${site.url}/` }
}

export function buildSoftwareAppLd(p: { name: string; url: string; description: string; appType?: AppLdType }) {
  return {
    // WebApplication 是 SoftwareApplication 的子類別，同一組屬性完全通用。
    // 預設維持 SoftwareApplication；/scan/ 與 /barcode/ 用 WebApplication。
    '@context': 'https://schema.org', '@type': p.appType ?? 'SoftwareApplication',
    name: p.name, url: p.url, description: p.description,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
    inLanguage: IN_LANGUAGE,
    isPartOf: websiteRef(),
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
    inLanguage: IN_LANGUAGE,
  }
}

export function buildWebPageLd(p: { type: PageLdType; name: string; url: string; description: string }) {
  return {
    '@context': 'https://schema.org', '@type': p.type,
    name: p.name, url: p.url, description: p.description,
    inLanguage: IN_LANGUAGE,
    isPartOf: websiteRef(),
    publisher: publisherLd(),
  }
}

// 全站一份，放 App.vue。營運者是口袋工具（站群 hub），不是這個工具本身。
export function buildOrganizationLd() {
  return {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: publisher.name, url: publisher.url, logo: publisher.logo,
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
  if (kind === 'page') {
    return buildWebPageLd({ type: opts.pageType ?? 'WebPage', name: opts.title, url, description: opts.description })
  }
  return buildSoftwareAppLd({ name: opts.appName ?? site.name, url, description: opts.description, appType: opts.appType })
}

// 注意：刻意不產 FAQPage。Google 於 2026-05-07 起停止顯示 FAQ rich results，
// 該 schema 已無可見 SERP 收益；頁面上的 FAQ 文字內容照常保留（對長尾與 UX 仍有用）。
export function useSeoHead(opts: SeoHeadOptions) {
  const url = canonicalUrl(opts.path)
  const image = opts.ogImage ?? site.ogImage
  const ogImageUrl = `${site.url}${image.path}`
  const kind = opts.kind ?? 'app'
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
    { property: 'og:site_name', content: site.siteName },
    { property: 'og:locale', content: 'zh_TW' },
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
      { rel: 'alternate', hreflang: 'zh-Hant-TW', href: url },
    ],
    script: scripts,
  })
}
