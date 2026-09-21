<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { findGuide } from '@/content/guides'
import { guideBodies } from '@/content/guide-bodies'
import { useSeoHead } from '@/composables/useSeoHead'
import { site, author, publisher } from '@/config/site'
import { withBase } from '@/utils/with-base'
const route = useRoute()
// router 的 guideGuard 已擋掉不存在的 slug，這裡一定找得到。
const g = computed(() => findGuide(String(route.params.slug).replace(/\/+$/, ''))!)
// 本文是原生 <a href="/...">、<img src="/...">，不經 Vite base 也不經 vue-router，必須自行補前綴。
const bodyHtml = computed(() => withBase(guideBodies[g.value.slug]))
// 顯示用日期：2026-09-21 → 2026 年 9 月 21 日
function zhDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y} 年 ${m} 月 ${d} 日`
}
useSeoHead({
  title: g.value.title, description: g.value.description, path: `/guide/${g.value.slug}`,
  kind: 'article',
  dates: { published: g.value.published, modified: g.value.updated },
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: '教學', url: `${site.url}/guide/` },
    { name: g.value.title, url: `${site.url}/guide/${g.value.slug}/` },
  ],
})
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <nav aria-label="麵包屑" class="text-sm text-muted font-600">
      <RouterLink to="/" class="hover:text-brand underline underline-offset-2">首頁</RouterLink>
      <span class="mx-1.5">›</span>
      <RouterLink to="/guide/" class="hover:text-brand underline underline-offset-2">教學</RouterLink>
    </nav>
    <h1 class="text-3xl md:text-4xl font-800 text-ink mt-3">{{ g.title }}</h1>
    <p class="text-sm text-muted font-600 mt-3" data-test="guide-byline">
      作者：<a :href="author.url" class="underline underline-offset-2 hover:text-brand">{{ author.name }}</a>（<a :href="publisher.url" class="underline underline-offset-2 hover:text-brand">口袋工具</a>）
      <span class="mx-1.5">·</span>
      最後更新：<time :datetime="g.updated">{{ zhDate(g.updated) }}</time>
      <span class="mx-1.5">·</span>
      首次發布：<time :datetime="g.published">{{ zhDate(g.published) }}</time>
    </p>
    <div class="mt-5 text-ink/80 font-600 leading-7 [&_p]:my-3 [&_h2]:(text-xl font-800 text-ink mt-7 mb-2) [&_h3]:(text-lg font-700 text-ink mt-5 mb-1) [&_ul]:(list-disc pl-5 my-3 space-y-1) [&_ol]:(list-decimal pl-5 my-3) [&_li]:my-1 [&_a]:(text-brand underline underline-offset-2 font-700 hover:text-brand-700) [&_strong]:text-ink [&_code]:(bg-pop-sun/30 px-1 rounded font-mono text-sm)" v-html="bodyHtml" />
    <RouterLink to="/" class="btn-primary inline-flex mt-8">開始製作 QR Code</RouterLink>
  </article>
</template>
