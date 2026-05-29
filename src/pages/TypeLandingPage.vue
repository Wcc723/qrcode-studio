<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { qrTypeByPath } from '@/config/qr-types'
import GeneratorTool from '@/components/GeneratorTool.vue'
import SeoContent from '@/components/SeoContent.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'

const route = useRoute()
const meta = computed(() => qrTypeByPath[route.path])
useSeoHead({
  title: meta.value.title, description: meta.value.description,
  path: meta.value.path, faqs: meta.value.faqs,
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: `${meta.value.label} QR Code`, url: `${site.url}${meta.value.path}/` },
  ],
})
</script>
<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-5">
      <span class="chip bg-pop-sun reveal reveal-1">🔒 免費・不上傳</span>
      <h1 class="text-3xl md:text-4xl font-800 text-ink mt-3 reveal reveal-2">{{ meta.h1 }}</h1>
      <p class="text-muted font-600 mt-2 reveal reveal-3">{{ meta.description }}</p>
    </header>
    <div class="max-w-screen-lg mx-auto px-4">
      <div class="reveal reveal-4"><GeneratorTool :default-type="meta.type" /></div>
      <AdSlot slot-id="landing-below-tool" />
    </div>
    <SeoContent :meta="meta" />
  </div>
</template>
