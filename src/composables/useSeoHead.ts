import { useHead } from '@unhead/vue'
import type { Script } from '@unhead/vue'
import { site } from '@/config/site'
import type { FaqItem } from '@/config/qr-types'

export function buildSoftwareAppLd(p: { name: string; url: string; description: string }) {
  return {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: p.name, url: p.url, description: p.description,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
  }
}

export function buildFaqLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
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

export function useSeoHead(opts: { title: string; description: string; path: string; faqs?: FaqItem[]; breadcrumbs?: { name: string; url: string }[] }) {
  const normalizedPath = opts.path === '/' ? '/' : `${opts.path.replace(/\/$/, '')}/`
  const url = `${site.url}${normalizedPath}`
  const scripts: Script[] = [
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildSoftwareAppLd({ name: opts.title, url, description: opts.description })) },
  ]
  if (opts.faqs?.length) {
    scripts.push({ type: 'application/ld+json', innerHTML: JSON.stringify(buildFaqLd(opts.faqs)) })
  }
  if (opts.breadcrumbs?.length) {
    scripts.push({ type: 'application/ld+json', innerHTML: JSON.stringify(buildBreadcrumbLd(opts.breadcrumbs)) })
  }
  useHead({
    title: opts.title,
    meta: [
      { name: 'description', content: opts.description },
      { property: 'og:title', content: opts.title },
      { property: 'og:description', content: opts.description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [
      { rel: 'canonical', href: url },
      { rel: 'alternate', hreflang: 'zh-Hant-TW', href: url },
    ],
    script: scripts,
  })
}
