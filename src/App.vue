<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useHead } from '@unhead/vue'
import { buildOrganizationLd } from '@/composables/useSeoHead'
useHead({
  htmlAttrs: { lang: 'zh-Hant-TW' },
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(buildOrganizationLd()) }],
})
</script>
<template>
  <DefaultLayout><RouterView :key="$route.path" /></DefaultLayout>
</template>
