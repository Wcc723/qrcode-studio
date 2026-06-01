import { useHead } from '@unhead/vue'
import type { Script } from '@unhead/vue'
import { site } from '@/config/site'

export function buildSoftwareAppLd(p: { name: string; url: string; description: string }) {
  return {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: p.name, url: p.url, description: p.description,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
  }
}

export function buildArticleLd(p: { title: string; url: string; description: string }) {
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: p.title, description: p.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': p.url },
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name },
    inLanguage: 'zh-Hant-TW',
  }
}

// 全站一份，放 App.vue
export function buildOrganizationLd() {
  return {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: site.name, url: site.url,
    ...(site.ogImage ? { logo: `${site.url}${site.ogImage}` } : {}),
  }
}

export function buildBreadcrumbLd(items: { name: string; url: string }[]) {
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

// 注意：刻意不產 FAQPage。Google 於 2026-05-07 起停止顯示 FAQ rich results，
// 該 schema 已無可見 SERP 收益；頁面上的 FAQ 文字內容照常保留（對長尾與 UX 仍有用）。
export function useSeoHead(opts: { title: string; description: string; path: string; breadcrumbs?: { name: string; url: string }[]; article?: boolean }) {
  const normalizedPath = opts.path === '/' ? '/' : `${opts.path.replace(/\/$/, '')}/`
  const url = `${site.url}${normalizedPath}`
  const ogImage = site.ogImage ? `${site.url}${site.ogImage}` : ''
  // 教學文章用 Article schema；工具頁用 SoftwareApplication
  const primaryLd = opts.article
    ? buildArticleLd({ title: opts.title, url, description: opts.description })
    : buildSoftwareAppLd({ name: opts.title, url, description: opts.description })
  const scripts: Script[] = [
    { type: 'application/ld+json', innerHTML: JSON.stringify(primaryLd) },
  ]
  if (opts.breadcrumbs?.length) {
    scripts.push({ type: 'application/ld+json', innerHTML: JSON.stringify(buildBreadcrumbLd(opts.breadcrumbs)) })
  }
  const meta = [
    { name: 'description', content: opts.description },
    { property: 'og:title', content: opts.title },
    { property: 'og:description', content: opts.description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: opts.article ? 'article' : 'website' },
    { property: 'og:site_name', content: site.name },
    { property: 'og:locale', content: 'zh_TW' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: opts.title },
    { name: 'twitter:description', content: opts.description },
  ]
  if (ogImage) {
    meta.push({ property: 'og:image', content: ogImage })
    meta.push({ name: 'twitter:image', content: ogImage })
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
