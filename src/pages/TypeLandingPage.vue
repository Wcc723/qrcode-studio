<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { qrTypeByPath } from '@/config/qr-types'
import GeneratorTool from '@/components/GeneratorTool.vue'
import SeoContent from '@/components/SeoContent.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'

const route = useRoute()
const meta = computed(() => qrTypeByPath[route.path])
useSeoHead({
  title: meta.value.title, description: meta.value.description,
  path: meta.value.path, faqs: meta.value.faqs,
})
</script>
<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-5">
      <h1 class="text-2xl md:text-3xl font-700 text-ink">{{ meta.h1 }}</h1>
      <p class="text-muted mt-2">{{ meta.description }}</p>
    </header>
    <div class="max-w-screen-lg mx-auto px-4">
      <GeneratorTool :default-type="meta.type" />
      <AdSlot slot-id="landing-below-tool" />
    </div>
    <SeoContent :meta="meta" />
  </div>
</template>
