<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { guideBySlug } from '@/content/guides'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
const route = useRoute()
const g = computed(() => guideBySlug[route.params.slug as string])
useSeoHead({
  title: g.value.title, description: g.value.description, path: `/guide/${g.value.slug}`,
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: g.value.title, url: `${site.url}/guide/${g.value.slug}/` },
  ],
})
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <span class="chip bg-pop-sun">📖 教學</span>
    <h1 class="text-3xl md:text-4xl font-800 text-ink mt-3">{{ g.title }}</h1>
    <div class="mt-5 text-ink/80 font-600 leading-7 [&_p]:my-3 [&_h2]:(text-xl font-700 text-ink mt-7 mb-2) [&_h3]:(text-lg font-700 text-ink mt-5 mb-1) [&_ul]:(list-disc pl-5 my-3) [&_ol]:(list-decimal pl-5 my-3) [&_li]:my-1" v-html="g.bodyHtml" />
    <RouterLink to="/" class="btn-primary inline-flex mt-8">開始製作 QR Code</RouterLink>
  </article>
</template>
