<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { qrTypeByPath } from '@/config/qr-types'
import GeneratorTool from '@/components/GeneratorTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import SeoContent from '@/components/SeoContent.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'

const route = useRoute()
// qrTypeByPath 同時收錄有/無結尾斜線的 key，故 /wifi 與 /wifi/ 皆可解析
const meta = computed(() => qrTypeByPath[route.path])
useSeoHead({
  title: meta.value.title, description: meta.value.description,
  path: meta.value.path,
  appName: meta.value.h1,
  breadcrumbs: [
    { name: '首頁', url: `${site.url}/` },
    { name: `${meta.value.label} QR Code`, url: `${site.url}${meta.value.path}/` },
  ],
})
</script>
<template>
  <div>
    <ToolZone :lead="meta.lead">
      <template #title>{{ meta.h1 }}</template>
      <GeneratorTool :default-type="meta.type" />
    </ToolZone>
    <div class="max-w-screen-lg mx-auto px-4"><AdSlot slot-id="landing-below-tool" /></div>
    <SeoContent :meta="meta" />
  </div>
</template>
