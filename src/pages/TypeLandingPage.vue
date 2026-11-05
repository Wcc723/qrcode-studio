<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { qrTypeByPath } from '@/config/qr-types'
import GeneratorTool from '@/components/GeneratorTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import SeoContent from '@/components/SeoContent.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site, publisher } from '@/config/site'

const route = useRoute()
// qrTypeByPath 同時收錄有/無結尾斜線的 key，故 /wifi 與 /wifi/ 皆可解析
const meta = computed(() => qrTypeByPath[route.path])
useSeoHead({
  title: meta.value.title, description: meta.value.description,
  path: meta.value.path,
  appName: meta.value.h1,
  // 每個類型自己的分享圖（scripts/brand/cards.mjs 的 page 對到這一頁，render.mjs 產到 public/og-<type>.png）
  ogImage: { path: `/og-${meta.value.type}.png`, width: 1200, height: 630, alt: meta.value.ogAlt },
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: `${meta.value.label} QR Code`, url: `${site.url}${meta.value.path}/` },
  ],
})
// 看得到的導覽路徑（2026-11 改版）：口袋工具 › 本站首頁 › 這一頁
const crumbs = computed(() => [
  { label: '口袋工具', href: publisher.url },
  { label: site.name, to: '/' },
  { label: `${meta.value.label} QR Code` },
])
</script>
<template>
  <div>
    <ToolZone :lead="meta.lead" :art="`type-${meta.type}-160.webp`" deco="deco-stand-240.webp" :crumbs="crumbs" crumbs-label="導覽路徑">
      <template #title>{{ meta.h1 }}</template>
      <GeneratorTool :default-type="meta.type" />
    </ToolZone>
    <div class="max-w-screen-lg mx-auto px-4"><AdSlot slot-id="landing-below-tool" /></div>
    <SeoContent :meta="meta" />
  </div>
</template>
